"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/action-state";
import type { LeadStage, LeadTemperature } from "@/lib/database.types";
import { followUpStages, initialCatalogOptions, nextFollowUpStage, outcomes, stageLabels, type CatalogCategory, type Outcome } from "@/lib/crm";

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

function dateTimeFromForm(formData: FormData, prefix: string, legacyName: string) {
  const date = required(formData, `${prefix}_date`);
  const time = required(formData, `${prefix}_time`);
  return localToIso(date && time ? `${date}T${time}` : required(formData, legacyName));
}

async function rememberCatalogValue(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, category: CatalogCategory, label: string) {
  const value = label.trim();
  if (!value) return;
  await supabase.from("catalog_options").upsert({ user_id: userId, category, label: value, active: true, updated_at: new Date().toISOString() }, { onConflict: "user_id,category,normalized_value", ignoreDuplicates: true });
}

function revalidateCrm(leadId?: string) {
  ["/today", "/agenda", "/pipeline", "/leads", "/dicas"].forEach((path) => revalidatePath(path));
  if (leadId) revalidatePath(`/leads/${leadId}`);
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
  const dueAt = dateTimeFromForm(formData, "due", "due_at");
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

  await Promise.all([
    supabase.from("activities").insert({ user_id: userId, lead_id: lead.id, type: "note", event_type: "lead.created", event_key: `lead-created:${lead.id}`, content: "Lead criado com primeira próxima ação definida." }),
    rememberCatalogValue(supabase, userId, "niche", optional(formData, "niche") ?? ""),
    rememberCatalogValue(supabase, userId, "source", optional(formData, "source") ?? ""),
    rememberCatalogValue(supabase, userId, "service_interest", optional(formData, "service_interest") ?? ""),
    rememberCatalogValue(supabase, userId, "action_type", taskTitle),
  ]);
  revalidateCrm(lead.id);
  redirect(`/leads/${lead.id}`);
}

export async function completeTaskAction(taskId: string, leadId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await authenticated();
  const outcome = required(formData, "outcome") as Outcome;
  const definition = outcomes.find((item) => item.value === outcome);
  if (!definition) return { error: "Escolha o que aconteceu antes de concluir." };

  const activeOutcome = !["not_interested", "sale"].includes(outcome);
  const nextTitle = required(formData, "next_title") || definition.nextTitle;
  const dueAt = dateTimeFromForm(formData, "next_due", "next_due_at");
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
  if (followUpStages.includes(lead.stage) && activeOutcome) nextStage = nextFollowUpStage(lead.stage) ?? lead.stage;
  if (lead.stage === "follow_up_6" && outcome === "talk_later") nextStage = "nurture";
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
    event_type: "task.completed",
    event_key: `task-completed:${taskId}`,
    metadata: { task_id: taskId, outcome, previous_stage: lead.stage, next_stage: nextStage ?? lead.stage },
    content: `${outcomeLabel}${details ? ` — ${details}` : ""}`,
  });

  await rememberCatalogValue(supabase, userId, "action_type", nextTitle);
  revalidateCrm(leadId);
  return { success: activeOutcome ? "Ação concluída e próxima ação criada." : "Ação concluída e lead atualizado." };
}

export async function updateLeadAction(leadId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await authenticated();
  const name = required(formData, "name");
  if (!name) return { error: "O nome é obrigatório." };
  const potentialValue = Number(required(formData, "potential_value").replace(",", ".")) || 0;
  const { error } = await supabase.from("leads").update({
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
    timing: optional(formData, "timing"),
    notes: optional(formData, "notes"),
    updated_at: new Date().toISOString(),
  }).eq("id", leadId);
  if (error) return { error: error.message };
  await Promise.all([
    rememberCatalogValue(supabase, userId, "niche", optional(formData, "niche") ?? ""),
    rememberCatalogValue(supabase, userId, "source", optional(formData, "source") ?? ""),
    rememberCatalogValue(supabase, userId, "service_interest", optional(formData, "service_interest") ?? ""),
  ]);
  revalidateCrm(leadId);
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
  const dueAt = dateTimeFromForm(formData, "due", "due_at");
  if (!title || !dueAt) return { error: "Defina a ação e a data/hora." };
  const { error } = await supabase.from("tasks").insert({ user_id: userId, lead_id: leadId, title, due_at: dueAt });
  if (error) return { error: error.message };
  await Promise.all([
    supabase.from("activities").insert({ user_id: userId, lead_id: leadId, type: "note", event_type: "task.created", content: `Próxima ação criada: ${title}.` }),
    rememberCatalogValue(supabase, userId, "action_type", title),
  ]);
  revalidateCrm(leadId);
  return { success: "Próxima ação criada." };
}

export async function moveLeadAction(formData: FormData) {
  const leadId = required(formData, "lead_id");
  const stage = required(formData, "stage") as LeadStage;
  if (!leadId || !stage) return;
  await moveLeadStageAction(leadId, stage, required(formData, "event_key") || crypto.randomUUID());
}

export async function moveLeadStageAction(leadId: string, stage: LeadStage, eventKey: string): Promise<ActionState> {
  const { supabase, userId } = await authenticated();
  if (!stageLabels[stage]) return { error: "Estágio inválido." };
  const { data: lead, error: readError } = await supabase.from("leads").select("stage, archived_at").eq("id", leadId).single();
  if (readError || !lead) return { error: "Lead não encontrado." };
  if (lead.stage === stage && !lead.archived_at) return { success: "O lead já está nesse estágio." };
  const { error } = await supabase.from("leads").update({ stage, archived_at: null, archive_reason: null, updated_at: new Date().toISOString() }).eq("id", leadId);
  if (error) return { error: error.message };
  const { error: activityError } = await supabase.from("activities").insert({
    user_id: userId, lead_id: leadId, type: "stage_change", event_type: "lead.stage_changed", event_key: eventKey,
    metadata: { from: lead.stage, to: stage }, content: `Estágio alterado de ${stageLabels[lead.stage]} para ${stageLabels[stage]}.`,
  });
  if (activityError && activityError.code !== "23505") return { error: "O estágio foi alterado, mas a timeline não pôde ser atualizada." };
  if (followUpStages.includes(stage)) {
    const { data: futureTask } = await supabase.from("tasks").select("id").eq("lead_id", leadId).is("completed_at", null).gte("due_at", new Date().toISOString()).limit(1).maybeSingle();
    if (!futureTask) {
      const dueAt = new Date(Date.now() + 2 * 86400000).toISOString();
      const title = stage === "follow_up" ? "Primeiro follow-up" : stageLabels[stage];
      await supabase.from("tasks").insert({ user_id: userId, lead_id: leadId, title, due_at: dueAt });
      await supabase.from("activities").insert({ user_id: userId, lead_id: leadId, type: "note", event_type: "task.created", content: `Próxima ação sugerida para dois dias: ${title}.` });
    }
  }
  revalidateCrm(leadId);
  return { success: `Movido para ${stageLabels[stage]}.` };
}

export async function rescheduleTaskAction(taskId: string, leadId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await authenticated();
  const dueAt = dateTimeFromForm(formData, "due", "due_at");
  const title = required(formData, "title");
  if (!dueAt || !title) return { error: "Informe ação, data e horário válidos." };
  const { data: task } = await supabase.from("tasks").select("due_at, completed_at").eq("id", taskId).eq("lead_id", leadId).single();
  if (!task || task.completed_at) return { error: "Esta ação não está mais disponível." };
  const { error } = await supabase.from("tasks").update({ title, due_at: dueAt, rescheduled_from: task.due_at, updated_at: new Date().toISOString() }).eq("id", taskId).is("completed_at", null);
  if (error) return { error: error.message };
  await Promise.all([
    supabase.from("activities").insert({ user_id: userId, lead_id: leadId, type: "note", event_type: "task.rescheduled", content: `Ação reagendada: ${title}.`, metadata: { task_id: taskId, from: task.due_at, to: dueAt } }),
    rememberCatalogValue(supabase, userId, "action_type", title),
  ]);
  revalidateCrm(leadId);
  return { success: "Ação reagendada." };
}

export async function archiveLeadAction(leadId: string, cancelFutureTasks: boolean, eventKey: string): Promise<ActionState> {
  const { supabase, userId } = await authenticated();
  const now = new Date().toISOString();
  const { error } = await supabase.from("leads").update({ archived_at: now, archive_reason: "Retirado da pipeline", updated_at: now }).eq("id", leadId).is("archived_at", null);
  if (error) return { error: error.message };
  if (cancelFutureTasks) await supabase.from("tasks").update({ completed_at: now, updated_at: now }).eq("lead_id", leadId).is("completed_at", null);
  await supabase.from("activities").insert({ user_id: userId, lead_id: leadId, type: "stage_change", event_type: "lead.archived", event_key: eventKey, metadata: { future_tasks_cancelled: cancelFutureTasks }, content: `Lead arquivado. Ações futuras ${cancelFutureTasks ? "foram canceladas" : "foram mantidas"}.` });
  revalidateCrm(leadId);
  return { success: "Lead removido da pipeline. O histórico foi preservado." };
}

export async function restoreLeadAction(leadId: string): Promise<ActionState> {
  const { supabase, userId } = await authenticated();
  const { error } = await supabase.from("leads").update({ archived_at: null, archive_reason: null, updated_at: new Date().toISOString() }).eq("id", leadId);
  if (error) return { error: error.message };
  await supabase.from("activities").insert({ user_id: userId, lead_id: leadId, type: "stage_change", event_type: "lead.restored", content: "Lead restaurado para a pipeline." });
  revalidateCrm(leadId);
  return { success: "Lead restaurado." };
}

export async function restoreLeadFormAction(leadId: string) {
  await restoreLeadAction(leadId);
}

export async function markDailyTipReadAction(localDate: string): Promise<void> {
  const { supabase } = await authenticated();
  await supabase.from("user_daily_tips").update({ read_at: new Date().toISOString() }).eq("local_date", localDate).is("read_at", null);
  revalidatePath("/dicas");
}

export async function seedCatalogsAction() {
  const { supabase, userId } = await authenticated();
  const rows = Object.entries(initialCatalogOptions).flatMap(([category, labels]) => labels.map((label) => ({ user_id: userId, category, label })));
  await supabase.from("catalog_options").upsert(rows, { onConflict: "user_id,category,normalized_value", ignoreDuplicates: true });
}
