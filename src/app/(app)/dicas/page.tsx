import { createClient } from "@/lib/supabase/server";
import { markDailyTipReadAction } from "@/app/(app)/actions";
import { PageHeader } from "@/components/page-header";
import { getGamification } from "@/lib/gamification";

export const metadata = { title: "Dicas" };

function localDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default async function TipsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string;
  const date = localDate();
  let { data: assignment } = await supabase.from("user_daily_tips").select("tip_id,read_at,cycle").eq("local_date", date).maybeSingle();
  if (!assignment) {
    const [{ data: used }, { data: tips }] = await Promise.all([
      supabase.from("user_daily_tips").select("tip_id,cycle"),
      supabase.from("daily_tips").select("id").eq("active", true).order("position"),
    ]);
    const currentCycle = Math.floor((used?.length ?? 0) / Math.max(tips?.length ?? 365, 1));
    const usedIds = new Set((used ?? []).filter((item) => item.cycle === currentCycle).map((item) => item.tip_id));
    let available = (tips ?? []).filter((tip) => !usedIds.has(tip.id));
    if (!available.length) available = tips ?? [];
    const seed = [...`${userId}:${date}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const selected = available[seed % Math.max(available.length, 1)];
    if (selected) {
      const { error } = await supabase.from("user_daily_tips").insert({ user_id: userId, local_date: date, tip_id: selected.id, cycle: currentCycle });
      if (!error) assignment = { tip_id: selected.id, read_at: null, cycle: currentCycle };
      else ({ data: assignment } = await supabase.from("user_daily_tips").select("tip_id,read_at,cycle").eq("local_date", date).maybeSingle());
    }
  }
  const [{ data: tip }, game] = await Promise.all([
    assignment ? supabase.from("daily_tips").select("category,content,position").eq("id", assignment.tip_id).single().then((result) => result) : Promise.resolve({ data: null }),
    getGamification(supabase),
  ]);
  return <>
    <PageHeader eyebrow="Desenvolvimento diário" title="Dica do dia" description="A mesma dica permanece durante todo o dia e só volta depois que o catálogo for percorrido." />
    <section className="mx-auto max-w-3xl rounded-3xl border border-blue-400/25 bg-gradient-to-br from-[#101d30] to-[#0b0e14] p-7 sm:p-10">
      <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-blue-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-blue-200">{tip?.category ?? "Vendas"}</span><span className="text-xs text-slate-600">Dica {tip?.position ?? "—"} de 365</span></div>
      <p className="mt-8 text-2xl font-medium leading-relaxed tracking-[-.02em] sm:text-3xl">{tip?.content ?? "Não foi possível atribuir a dica de hoje."}</p>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6"><p className="text-sm text-slate-500">{game.xp} XP · sequência de {game.streak} dia(s)</p>{assignment ? (!assignment.read_at ? <form action={markDailyTipReadAction.bind(null, date)}><button className="primary-button">Marcar como lida</button></form> : <span className="text-sm font-semibold text-emerald-300">Lida hoje</span>) : <span className="text-sm text-red-300">Atribuição indisponível</span>}</div>
    </section>
    {!!game.achievements.length && <section className="mx-auto mt-6 max-w-3xl"><h2 className="text-sm font-semibold">Conquistas</h2><div className="mt-3 flex flex-wrap gap-2">{game.achievements.map((item) => <span key={item} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">{item}</span>)}</div></section>}
  </>;
}
