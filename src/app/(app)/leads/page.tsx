import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Plus, Search } from "@/components/icons";
import { StageBadge, TemperatureBadge } from "@/components/status";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("leads").select("*").order("updated_at", { ascending: false });
  if (q.trim()) {
    const term = q.trim().replace(/[,%()]/g, "");
    query = query.or(`name.ilike.%${term}%,company.ilike.%${term}%`);
  }
  const { data: leads } = await query;

  return (
    <>
      <PageHeader eyebrow="Base comercial" title="Leads" description="Todos os contatos, com contexto e próximo passo visíveis." action={<Link href="/leads/new" className="primary-button"><Plus size={16} /> Novo lead</Link>} />
      <form className="mb-5 flex max-w-lg gap-2" action="/leads">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} /><input name="q" defaultValue={q} className="field pl-10" placeholder="Buscar por nome ou empresa" /></div>
        <button className="ghost-button">Buscar</button>
      </form>

      {!leads?.length ? (
        <EmptyState title={q ? "Nenhum lead encontrado" : "Sua base começa aqui"} description={q ? "Tente buscar outro nome ou empresa." : "Cadastre o primeiro lead já com uma próxima ação e data definidas."} action={!q} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1016]">
          <div className="hidden grid-cols-[1.2fr_1fr_.8fr_.7fr_28px] gap-4 border-b border-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-slate-600 md:grid">
            <span>Contato</span><span>Estágio</span><span>Temperatura</span><span>Potencial</span><span />
          </div>
          <div className="divide-y divide-white/[.07]">
            {leads.map((lead) => (
              <Link href={`/leads/${lead.id}`} key={lead.id} className="grid gap-3 px-4 py-4 transition hover:bg-white/[.025] md:grid-cols-[1.2fr_1fr_.8fr_.7fr_28px] md:items-center md:gap-4 md:px-5">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{lead.name}</p><p className="mt-1 truncate text-xs text-slate-500">{lead.company || lead.whatsapp || "Sem empresa"}</p></div>
                <div><StageBadge value={lead.stage} /></div>
                <div><TemperatureBadge value={lead.temperature} /></div>
                <p className="text-sm font-medium text-slate-300">{formatMoney(lead.potential_value)}</p>
                <span className="text-right text-slate-600">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
