"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/action-state";
import type { LeadStage, LeadTemperature } from "@/lib/database.types";
import { outcomes, stageLabels, type Outcome } from "@/lib/crm";

async function authenticated() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");
  return { supabase, userId };
}

function required(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optional(formData: FormData, name: string) {
  const value = required(formData, name);
  return value || null;
}

function localToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createLeadAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await authenticated();
  const name = required(formData, "name");
  const taskTitle = required(formData, "task_title");
  const dueAt = localToIso(required(formData, "due_at"));
  if (!name || !taskTitle || !dueAt) return { error: "Nome, primeira próxima ação e data/hora são obrigatórios." };

  const potentialValue = Number(required(formData, "potential_value").replace(",", ".")) || 0;
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      user_id: userId,
      name,
      company: optional(formData, "company"),
      whatsapp: optional(formData, "whatsapp"),
      niche: optional(formData, "niche"),
      source: optional(formData, "source"),
      service_interest: optional(formData, "service_interest"),
      potential_value: potentialValue,
      stage: required(formData, "stage") as LeadStage,
      temperature: required(formData, "temperature") as LeadTemperature,
      problem: optional(formData, "problem"),
      objection: optional(formData, "objection"),
      notes: optional(formData, "notes"),
    })
    .select("id")
    .single();

  if (leadError || !lead) return { error: leadError?.message ?? "Não foi possível criar o lead." };

  const { error: taskError } = await supabase.from("tasks").insert({ user_id: userId, lead_id: lead.id, title: taskTitle, due_at: dueAt });
  if (taskError) {
    await supabase.from("leads").delete().eq("id", lead.id);
    return { error: "O lead não foi salvo porque a primeira ação não pôde ser criada." };
  }

  await supabase.from("activities").insert({ user_id: userId, lead_id: lead.id, type: "note", content: "Lead criado com primeira próxima ação definida." });
  revalidatePath("/today");
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function completeTaskAction(taskId: string, leadId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await authenticated();
  const outcome = required(formData, "outcome") as Outcome;
  const definition = outcomes.find((item) => item.value === outcome);
  if (!definition) return { error: "Escolha o que aconteceu antes de concluir." };

  const activeOutcome = !["not_interested", "sale"].includes(outcome);
  const nextTitle = required(formData, "next_title") || definition.nextTitle;
  const dueAt = localToIso(required(formData, "next_due_at"));
  if (activeOutcome && (!nextTitle || !dueAt)) return { error: "Defina a próxima ação e quando ela deve acontecer." };

  const [{ data: task, error: taskReadError }, { data: lead, error: leadReadError }] = await Promise.all([
    supabase.from("tasks").select("id, completed_at").eq("id", taskId).eq("lead_id", leadId).single(),
    supabase.from("leads").select("stage, loss_reason").eq("id", leadId).single(),
  ]);
  if (taskReadError || leadReadError || !task || !lead || task.completed_at) return { error: "Esta ação já foi concluída ou não está mais disponível." };

  const stageByOutcome: Partial<Record<Outcome, LeadStage>> = {
    responded: "conversation",
    no_response: "contact_attempt",
    meeting_scheduled: "meeting_scheduled",
    talk_later: "follow_up",
    not_interested: "lost",
    sale: "won",
  };
  let nextStage = stageByOutcome[outcome];
  if (outcome === "responded" && !["new", "contact_attempt", "conversation"].includes(lead.stage)) nextStage = lead.stage;
  if (outcome === "no_response" && !["new", "contact_attempt"].includes(lead.stage)) nextStage = lead.stage;
  const outcomeLabel = definition.label;
  const details = optional(formData, "details");

  let nextTaskId: string | null = null;
  if (activeOutcome && dueAt) {
    const { data: createdTask, error } = await supabase.from("tasks").insert({ user_id: userId, lead_id: leadId, title: nextTitle, due_at: dueAt }).select("id").single();
    if (error || !createdTask) return { error: `A próxima ação não pôde ser criada: ${error?.message ?? "erro inesperado"}` };
    nextTaskId = createdTask.id;
  }

  if (nextStage) {
    const leadUpdate = outcome === "not_interested"
      ? { stage: nextStage, loss_reason: details ?? "Sem interesse", updated_at: new Date().toISOString() }
      : { stage: nextStage, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("leads").update(leadUpdate).eq("id", leadId);
    if (error) {
      if (nextTaskId) await supabase.from("tasks").delete().eq("id", nextTaskId);
      return { error: error.message };
    }
  }

  const { data: completedTask, error: completeError } = await supabase.from("tasks").update({ completed_at: new Date().toISOString() }).eq("id", taskId).is("completed_at", null).select("id").maybeSingle();
  if (completeError || !completedTask) {
    if (nextTaskId) await supabase.from("tasks").delete().eq("id", nextTaskId);
    if (nextStage) await supabase.from("leads").update({ stage: lead.stage, loss_reason: lead.loss_reason }).eq("id", leadId);
    return { error: completeError?.message ?? "A ação foi alterada em outra sessão. Atualize a página." };
  }

  if (!activeOutcome) {
    await supabase.from("tasks").update({ completed_at: new Date().toISOString() }).eq("lead_id", leadId).is("completed_at", null);
  }

  await supabase.from("activities").insert({
    user_id: userId,
    lead_id: leadId,
    type: "task_completed",
    content: `${outcomeLabel}${details ? ` — ${details}` : ""}`,
  });

  revalidatePath("/today");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  return { success: activeOutcome ? "Ação concluída e próxima ação criada." : "Ação concluída e lead atualizado." };
}

export async function updateLeadAction(leadId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await authenticated();
  const name = required(formData, "name");
  if (!name) return { error: "O nome é obrigatório." };
  const potentialValue = Number(required(formData, "potential_value").replace(",", ".")) || 0;
  const { error } = await supabase.from("leads").update({
    name,
    company: optional(formData, "company"),
    whatsapp: optional(formData, "whatsapp"),
    service_interest: optional(formData, "service_interest"),
    potential_value: potentialValue,
    stage: required(formData, "stage") as LeadStage,
    temperature: required(formData, "temperature") as LeadTemperature,
    problem: optional(formData, "problem"),
    objection: optional(formData, "objection"),
    timing: optional(formData, "timing"),
    notes: optional(formData, "notes"),
    updated_at: new Date().toISOString(),
  }).eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  return { success: "Lead atualizado." };
}

export async function addNoteAction(leadId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await authenticated();
  const content = required(formData, "content");
  if (!content) return { error: "Escreva uma observação." };
  const { error } = await supabase.from("activities").insert({ user_id: userId, lead_id: leadId, type: "note", content });
  if (error) return { error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { success: "Observação adicionada." };
}

export async function createTaskAction(leadId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await authenticated();
  const title = required(formData, "title");
  const dueAt = localToIso(required(formData, "due_at"));
  if (!title || !dueAt) return { error: "Defina a ação e a data/hora." };
  const { error } = await supabase.from("tasks").insert({ user_id: userId, lead_id: leadId, title, due_at: dueAt });
  if (error) return { error: error.message };
  await supabase.from("activities").insert({ user_id: userId, lead_id: leadId, type: "note", content: `Próxima ação criada: ${title}.` });
  revalidatePath("/today");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  return { success: "Próxima ação criada." };
}

export async function moveLeadAction(formData: FormData) {
  const { supabase, userId } = await authenticated();
  const leadId = required(formData, "lead_id");
  const stage = required(formData, "stage") as LeadStage;
  if (!leadId || !stage) return;
  const { error } = await supabase.from("leads").update({ stage, updated_at: new Date().toISOString() }).eq("id", leadId);
  if (!error) {
    await supabase.from("activities").insert({ user_id: userId, lead_id: leadId, type: "stage_change", content: `Estágio alterado para ${stageLabels[stage]}.` });
  }
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
}
