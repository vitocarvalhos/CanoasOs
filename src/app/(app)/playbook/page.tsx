import { PageHeader } from "@/components/page-header";
import { CopyMessage } from "@/components/copy-message";
import { playbookEntries } from "@/lib/playbook";

export const metadata = { title: "Playbook" };

export default function PlaybookPage() {
  return <>
    <PageHeader eyebrow="Biblioteca comercial" title="Playbook" description="Mensagens práticas para cada momento da venda. Personalize as variáveis antes de enviar." />
    <div className="grid gap-4 xl:grid-cols-2">{playbookEntries.map((entry) => <article key={entry.title} className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-300">{entry.channel}</p><h2 className="mt-2 text-lg font-semibold">{entry.title}</h2></div><CopyMessage text={entry.text} /></div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-600">Objetivo</dt><dd className="mt-1 text-slate-300">{entry.objective}</dd></div><div><dt className="text-xs text-slate-600">Quando usar</dt><dd className="mt-1 text-slate-300">{entry.moment}</dd></div></dl>
      <blockquote className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-200">{entry.text}</blockquote>
      <p className="mt-4 text-xs leading-5 text-slate-500"><strong className="text-slate-400">Variáveis:</strong> {entry.variables}</p>
      <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2"><p className="text-xs leading-5 text-emerald-200/80"><strong>Boa prática:</strong> {entry.practices}</p><p className="text-xs leading-5 text-red-200/80"><strong>Evite:</strong> {entry.mistakes}</p></div>
    </article>)}</div>
  </>;
}
