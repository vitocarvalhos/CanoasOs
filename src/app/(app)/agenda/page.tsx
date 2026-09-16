import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActionQueue } from "@/lib/action-queue";
import { formatDateTime, todayBounds } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { OutcomeDialog } from "@/components/outcome-dialog";
import { RescheduleDialog } from "@/components/reschedule-dialog";

export const metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = "week" } = await searchParams;
  const supabase = await createClient();
  const { start, end } = todayBounds();
  const horizon = view === "day" ? end : new Date(new Date(end).getTime() + 6 * 86400000).toISOString();
  const queue = await getActionQueue(supabase, { before: horizon, includeCompleted: true });
  const open = queue.filter((task) => !task.completed_at);
  const completed = queue.filter((task) => task.completed_at && task.completed_at >= start);
  const groups = [
    { title: "Atrasadas", items: open.filter((task) => task.due_at < start) },
    { title: "Hoje", items: open.filter((task) => task.due_at >= start && task.due_at < end) },
    { title: "Próximas", items: open.filter((task) => task.due_at >= end) },
    { title: "Concluídas", items: completed },
  ];
  return <>
    <PageHeader eyebrow="Execução comercial" title="Agenda" description="Uma fonte única para tarefas, reuniões e follow-ups." action={<div className="flex gap-2"><Link className={view === "day" ? "primary-button" : "ghost-button"} href="/agenda?view=day">Dia</Link><Link className={view !== "day" ? "primary-button" : "ghost-button"} href="/agenda?view=week">Semana</Link></div>} />
    <div className="space-y-7">{groups.map((group) => <section key={group.title}><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{group.title}</h2><span className="text-xs text-slate-600">{group.items.length}</span></div>
      <div className="space-y-2">{group.items.length ? group.items.map((task) => <article key={task.id} className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <Link href={`/leads/${task.lead_id}`} className="min-w-0 flex-1"><p className="truncate text-sm font-semibold hover:text-blue-300">{task.leads.name}</p><p className="mt-1 truncate text-xs text-slate-500">{task.title} · {formatDateTime(task.due_at)}</p></Link>
        {!task.completed_at && <div className="flex flex-wrap gap-2"><RescheduleDialog taskId={task.id} leadId={task.lead_id} title={task.title} dueAt={task.due_at} /><OutcomeDialog taskId={task.id} leadId={task.lead_id} /></div>}
      </article>) : <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-600">Nenhuma ação nesta seção.</p>}</div>
    </section>)}</div>
  </>;
}
