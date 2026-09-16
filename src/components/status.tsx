import type { LeadStage, LeadTemperature } from "@/lib/database.types";
import { stageLabels, temperatureLabels } from "@/lib/crm";

export function TemperatureBadge({ value }: { value: LeadTemperature }) {
  const styles = value === "hot" ? "border-orange-400/25 bg-orange-400/10 text-orange-200" : value === "warm" ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : "border-slate-500/20 bg-slate-500/10 text-slate-300";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${styles}`}>{temperatureLabels[value]}</span>;
}

export function StageBadge({ value }: { value: LeadStage }) {
  return <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] text-blue-200">{stageLabels[value]}</span>;
}
