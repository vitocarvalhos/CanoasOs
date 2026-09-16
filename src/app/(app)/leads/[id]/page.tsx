import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatMoney } from "@/lib/format";
import { whatsappUrl } from "@/lib/crm";
import { ArrowLeft, CalendarClock, MessageCircle, Phone } from "@/components/icons";
import { OutcomeDialog } from "@/components/outcome-dialog";
import { StageBadge, TemperatureBadge } from "@/components/status";
import { LeadDetailsForm, NextTaskForm, NoteForm } from "./lead-details-form";
import { initialCatalogOptions } from "@/lib/crm";

export const metadata = { title: "Ficha do lead" };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: lead }, { data: tasks }, { data: activities }, { data: catalogRows }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    supabase.from("tasks").select("*").eq("lead_id", id).order("due_at", { ascending: true }),
    supabase.from("activities").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("catalog_options").select("category,label").eq("active", true).order("label"),
  ]);
  if (!lead) notFound();
  const nextTask = tasks?.find((task) => !task.completed_at);
  const catalogs = Object.fromEntries(Object.entries(initialCatalogOptions).map(([category, defaults]) => [category, Array.from(new Set([...defaults, ...(catalogRows?.filter((item) => item.category === category).map((item) => item.label) ?? [])]))])) as typeof initialCatalogOptions;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/leads" className="mb-7 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"><ArrowLeft size={16} /> Voltar para leads</Link>
      <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2"><TemperatureBadge value={lead.temperature} /><StageBadge value={lead.stage} /></div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{lead.name}</h1>
          <p className="mt-2 text-sm text-slate-500">{lead.company || "Empresa não informada"} · {formatMoney(lead.potential_value)}</p>
        </div>
        <div className="flex gap-2">
          <a className={`secondary-button ${!lead.whatsapp ? "pointer-events-none opacity-40" : ""}`} href={whatsappUrl(lead.whatsapp, lead.name)} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>
          <a className={`ghost-button ${!lead.whatsapp ? "pointer-events-none opacity-40" : ""}`} href={lead.whatsapp ? `tel:${lead.whatsapp}` : "#"}><Phone size={16} /> Ligar</a>
        </div>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="panel p-5 sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">O que está acontecendo?</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{lead.notes || lead.problem || "Adicione um resumo para manter o contexto comercial visível."}</p>
            <div className="mt-6 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
              <Info label="Problema" value={lead.problem} />
              <Info label="Objeção" value={lead.objection} />
              <Info label="Serviço" value={lead.service_interest} />
              <Info label="Timing" value={lead.timing} />
            </div>
          </section>

          <LeadDetailsForm lead={lead} catalogs={catalogs} />

          <section className="panel p-5 sm:p-7">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Timeline</h2><span className="text-xs text-slate-600">{activities?.length ?? 0} registros</span></div>
            <NoteForm leadId={lead.id} />
            <div className="mt-6 space-y-5 border-l border-white/10 pl-5">
              {activities?.length ? activities.map((activity) => (
                <article key={activity.id} className="relative">
                  <span className="absolute -left-[25px] top-1 size-2 rounded-full bg-blue-400 ring-4 ring-[#0e1117]" />
                  <p className="text-sm leading-6 text-slate-300">{activity.content}</p>
                  <time className="mt-1 block text-[11px] text-slate-600">{formatDateTime(activity.created_at)}</time>
                </article>
              )) : <p className="text-sm text-slate-600">Nenhuma atividade registrada ainda.</p>}
            </div>
          </section>
        </div>

        <aside>
          <section className={`sticky top-24 rounded-2xl border p-5 sm:p-6 ${nextTask ? "border-blue-400/25 bg-[#0d1826]" : "border-red-400/25 bg-red-500/[.04]"}`}>
            <div className="flex items-center gap-2 text-blue-300"><CalendarClock size={17} /><p className="text-[10px] font-bold uppercase tracking-[.18em]">Próxima ação</p></div>
            {nextTask ? (
              <>
                <h2 className="mt-5 text-xl font-semibold leading-7">{nextTask.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{formatDateTime(nextTask.due_at)}</p>
                <div className="mt-6"><OutcomeDialog taskId={nextTask.id} leadId={lead.id} /></div>
              </>
            ) : (
              <><h2 className="mt-5 text-lg font-semibold">Sem próxima ação</h2><p className="mt-2 text-sm leading-6 text-slate-500">Crie uma tarefa para devolver este lead à fila de execução.</p><NextTaskForm leadId={lead.id} actionOptions={catalogs.action_type} /></>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-600">{label}</p><p className="mt-2 text-sm leading-6 text-slate-300">{value || "Não informado"}</p></div>;
}
