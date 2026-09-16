import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pipelineColumns, stageLabels } from "@/lib/crm";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Task } from "@/lib/database.types";
import { moveLeadAction } from "@/app/(app)/actions";
import { PageHeader } from "@/components/page-header";
import { Plus } from "@/components/icons";
import { TemperatureBadge } from "@/components/status";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const supabase = await createClient();
  const [{ data: leads }, { data: tasks }] = await Promise.all([
    supabase.from("leads").select("*").order("updated_at", { ascending: false }),
    supabase.from("tasks").select("*").is("completed_at", null).order("due_at", { ascending: true }),
  ]);
  const nextByLead = new Map<string, Task>();
  tasks?.forEach((task) => { if (!nextByLead.has(task.lead_id)) nextByLead.set(task.lead_id, task); });

  return (
    <>
      <PageHeader eyebrow="Visão de gestão" title="Pipeline" description="Veja onde estão as oportunidades e mova cada lead para o estágio correto." action={<Link href="/leads/new" className="primary-button"><Plus size={16} /> Novo lead</Link>} />
      <div className="-mx-4 overflow-x-auto px-4 pb-5 sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10">
        <div className="grid min-w-[1320px] grid-cols-6 gap-3">
          {pipelineColumns.map((column) => {
            const items = leads?.filter((lead) => column.stages.includes(lead.stage)) ?? [];
            const total = items.reduce((sum, lead) => sum + Number(lead.potential_value), 0);
            return (
              <section key={column.title} className="rounded-2xl border border-white/10 bg-[#0b0e13] p-3">
                <header className="mb-3 px-1 pb-3 border-b border-white/[.07]"><div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-[.12em] text-slate-300">{column.title}</h2><span className="rounded-full bg-white/[.07] px-2 py-0.5 text-[10px] text-slate-400">{items.length}</span></div><p className="mt-1.5 text-[11px] text-slate-600">{formatMoney(total)}</p></header>
                <div className="space-y-2.5">
                  {items.map((lead) => {
                    const next = nextByLead.get(lead.id);
                    const overdue = next && new Date(next.due_at) < new Date();
                    return (
                      <article key={lead.id} className="rounded-xl border border-white/10 bg-[#12161d] p-3.5 shadow-sm">
                        <Link href={`/leads/${lead.id}`} className="block hover:text-blue-300"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold leading-5">{lead.name}</p><TemperatureBadge value={lead.temperature} /></div><p className="mt-1 truncate text-xs text-slate-500">{lead.company || stageLabels[lead.stage]}</p></Link>
                        <div className={`mt-3 rounded-lg border px-2.5 py-2 ${!next ? "border-red-400/20 bg-red-500/[.05]" : overdue ? "border-red-400/20 bg-red-500/[.05]" : "border-white/[.07] bg-black/20"}`}><p className={`truncate text-[11px] ${!next || overdue ? "text-red-300" : "text-slate-400"}`}>{next ? next.title : "Sem próxima ação"}</p>{next && <p className="mt-1 text-[10px] text-slate-600">{formatDateTime(next.due_at)}</p>}</div>
                        <form action={moveLeadAction} className="mt-3 flex gap-1.5"><input type="hidden" name="lead_id" value={lead.id} /><select name="stage" defaultValue={lead.stage} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0b0e13] px-2 py-1.5 text-[10px] text-slate-400 outline-none">{column.stages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}{pipelineColumns.flatMap((item) => item.stages).filter((stage) => !column.stages.includes(stage)).map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select><button className="rounded-lg border border-white/10 px-2 text-[10px] text-slate-400 hover:text-white">Mover</button></form>
                      </article>
                    );
                  })}
                  {!items.length && <p className="px-2 py-8 text-center text-xs text-slate-700">Nenhum lead</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
