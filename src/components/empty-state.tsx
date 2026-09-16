import Link from "next/link";
import { Plus, Sparkles } from "@/components/icons";

export function EmptyState({ title, description, action = true }: { title: string; description: string; action?: boolean }) {
  return (
    <div className="panel flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <div className="grid size-11 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300"><Sparkles size={20} /></div>
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && <Link href="/leads/new" className="secondary-button mt-6"><Plus size={16} /> Novo lead</Link>}
    </div>
  );
}
