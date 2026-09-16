import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/database.types";
import { PageHeader } from "@/components/page-header";
import { PipelineBoard } from "@/components/pipeline-board";
import { Plus } from "@/components/icons";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const supabase = await createClient();
  const [{ data: leads }, { data: tasks }] = await Promise.all([
    supabase.from("leads").select("*").is("archived_at", null).order("updated_at", { ascending: false }),
    supabase.from("tasks").select("*").is("completed_at", null).order("due_at", { ascending: true }),
  ]);
  const nextByLead = new Map<string, Task>();
  tasks?.forEach((task) => { if (!nextByLead.has(task.lead_id)) nextByLead.set(task.lead_id, task); });
  const boardLeads = (leads ?? []).map((lead) => ({ ...lead, nextTask: nextByLead.get(lead.id) ?? null }));
  return <>
    <PageHeader eyebrow="Visão de gestão" title="Pipeline" description="Arraste por mouse, toque ou teclado. Ao mudar de macrofase, escolha o subestágio correto." action={<Link href="/leads/new" className="primary-button"><Plus size={16} /> Novo lead</Link>} />
    <PipelineBoard initialLeads={boardLeads} />
  </>;
}
