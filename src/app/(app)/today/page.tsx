import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { todayBounds, formatDateTime } from "@/lib/format";
import { whatsappUrl } from "@/lib/crm";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { OutcomeDialog } from "@/components/outcome-dialog";
import { CalendarClock, ChevronRight, Clock3, Flame, MessageCircle, Phone, Plus } from "@/components/icons";
import { TemperatureBadge } from "@/components/status";
import { getActionQueue } from "@/lib/action-queue";
import { getGamification } from "@/lib/gamification";

export const metadata = { title: "Hoje" };

export default async function TodayPage() {
  const supabase = await createClient();
  const { start, end } = todayBounds();
  const [queue, { count: hotCount }, game] = await Promise.all([
    getActionQueue(supabase, { before: end }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("temperature", "hot").is("archived_at", null).not("stage", "in", "(won,lost)"),
    getGamification(supabase),
  ]);
  const overdue = queue.filter((task) => task.due_at < start);
  const today = queue.filter((task) => task.due_at >= start);
  const next = queue[0];
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <>
      <PageHeader eyebrow="Sua central de execução" title="Hoje" description={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)} action={<Link href="/leads/new" className="primary-button"><Plus size={16} /> Novo lead</Link>} />
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Metric label="Atrasadas" value={overdue.length} icon={<Clock3 size={18} />} tone="danger" />
        <Metric label="Para hoje" value={today.length} icon={<CalendarClock size={18} />} />
        <Metric label="Oportunidades quentes" value={hotCount ?? 0} icon={<Flame size={18} />} tone="hot" />
      </section>
      <section className="mb-6 grid gap-4 rounded-2xl border border-blue-400/20 bg-blue-500/[.05] p-5 lg:grid-cols-[180px_1fr]">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-300">Progresso do dia</p><p className="mt-3 text-3xl font-semibold">{game.xp} XP</p><p className="mt-1 text-xs text-slate-500">{game.streak} dia(s) de sequência</p></div>
        <div className="grid gap-3 sm:grid-cols-3">{game.missions.map((mission) => <div key={mission.label} className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs font-semibold">{mission.label}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-400" style={{ width: `${mission.progress / mission.target * 100}%` }} /></div><p className="mt-2 text-[10px] text-slate-500">{mission.progress}/{mission.target}</p></div>)}</div>
      </section>

      {!next ? (
        <EmptyState title="Inbox zero. Dia em ordem." description="Não há ações vencidas ou previstas para hoje. Adicione um lead ou revise o pipeline." />
      ) : (
        <>
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#111b29] px-5 py-3.5 sm:px-7">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-300">Próxima ação</p>
              <p className={`text-xs font-semibold ${next.due_at < start ? "text-red-300" : "text-slate-400"}`}>{next.due_at < start ? "Atrasada · " : ""}{formatDateTime(next.due_at)}</p>
            </div>
            <div className="p-5 sm:p-7 lg:p-9">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <TemperatureBadge value={next.leads.temperature} />
                  <Link href={`/leads/${next.lead_id}`} className="mt-4 flex items-center gap-2 text-2xl font-semibold tracking-[-.03em] hover:text-blue-300 sm:text-3xl">
                    {next.leads.name}<ChevronRight size={22} className="text-slate-600" />
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">{next.leads.company || "Empresa não informada"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300 sm:max-w-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-600">Ação</p>
                  <p className="mt-1.5 font-semibold text-white">{next.title}</p>
                </div>
              </div>
              {next.leads.notes && <blockquote className="mt-7 border-l-2 border-blue-500/60 pl-4 text-sm leading-6 text-slate-400">{next.leads.notes}</blockquote>}
              <div className="mt-8 flex flex-wrap gap-2">
                <a href={whatsappUrl(next.leads.whatsapp, next.leads.name)} target="_blank" rel="noreferrer" aria-disabled={!next.leads.whatsapp} className={`secondary-button flex-1 sm:flex-none ${!next.leads.whatsapp ? "pointer-events-none opacity-40" : ""}`}><MessageCircle size={16} /> WhatsApp</a>
                <a href={next.leads.whatsapp ? `tel:${next.leads.whatsapp}` : "#"} aria-disabled={!next.leads.whatsapp} className={`ghost-button flex-1 sm:flex-none ${!next.leads.whatsapp ? "pointer-events-none opacity-40" : ""}`}><Phone size={16} /> Ligar</a>
                <OutcomeDialog taskId={next.id} leadId={next.lead_id} />
              </div>
            </div>
          </section>

          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Depois disso</h2>
              <span className="text-xs text-slate-600">{Math.max(queue.length - 1, 0)} ações restantes</span>
            </div>
            <div className="divide-y divide-white/[.07] rounded-2xl border border-white/10 bg-[#0d1016]">
              {queue.slice(1, 7).map((task) => (
                <Link key={task.id} href={`/leads/${task.lead_id}`} className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-white/[.025] sm:px-5">
                  <span className={`size-2 rounded-full ${task.due_at < start ? "bg-red-400" : "bg-amber-300"}`} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{task.leads.name}</p><p className="mt-1 truncate text-xs text-slate-500">{task.title}</p></div>
                  <time className="text-xs text-slate-500">{formatDateTime(task.due_at)}</time>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

function Metric({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone?: "danger" | "hot" }) {
  const iconStyle = tone === "danger" ? "bg-red-500/10 text-red-300" : tone === "hot" ? "bg-orange-500/10 text-orange-300" : "bg-blue-500/10 text-blue-300";
  return <div className="panel flex items-center gap-4 p-4 sm:p-5"><div className={`grid size-10 place-items-center rounded-xl ${iconStyle}`}>{icon}</div><div><p className="text-2xl font-semibold leading-none">{value}</p><p className="mt-1.5 text-xs text-slate-500">{label}</p></div></div>;
}
