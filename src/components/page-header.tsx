export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[.2em] text-blue-400">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </header>
  );
}
