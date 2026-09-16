"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, ChevronRight, Clock3, X } from "@/components/icons";
import { formatDateTime } from "@/lib/format";

type CenterTask = { id: string; leadId: string; leadName: string; title: string; dueAt: string; overdue: boolean };

export function ActionCenter({ tasks, overdue, today }: { tasks: CenterTask[]; overdue: number; today: number }) {
  const [open, setOpen] = useState(false);
  const total = overdue + today;
  return (
    <>
      <button className="relative grid size-10 place-items-center rounded-xl border border-white/10 text-slate-300 hover:bg-white/[.05]" onClick={() => setOpen(true)} aria-label={`Central de ações: ${total} pendentes`}>
        <Bell size={18} />
        {total > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">{total > 99 ? "99+" : total}</span>}
      </button>
      {open && <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
        <aside className="ml-auto h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0d1118] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()} aria-label="Central de ações">
          <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-300">Central global</p><h2 className="mt-2 text-xl font-semibold">Ações que pedem atenção</h2><p className="mt-2 text-sm text-slate-500">{overdue} atrasadas · {today} para hoje</p></div>
            <button className="grid size-9 place-items-center rounded-full border border-white/10" onClick={() => setOpen(false)} aria-label="Fechar"><X size={16} /></button>
          </header>
          <div className="mt-4 space-y-2">
            {tasks.length ? tasks.map((task) => <Link key={task.id} href={`/leads/${task.leadId}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.025] p-3 hover:border-blue-400/30">
              <span className={`grid size-9 place-items-center rounded-lg ${task.overdue ? "bg-red-500/10 text-red-300" : "bg-blue-500/10 text-blue-300"}`}><Clock3 size={16} /></span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{task.leadName}</strong><span className="mt-1 block truncate text-xs text-slate-500">{task.title} · {formatDateTime(task.dueAt)}</span></span><ChevronRight size={16} className="text-slate-600" />
            </Link>) : <p className="py-12 text-center text-sm text-slate-500">Nenhuma ação atrasada ou prevista para hoje.</p>}
          </div>
          <Link href="/agenda" onClick={() => setOpen(false)} className="primary-button mt-5 w-full">Abrir agenda</Link>
        </aside>
      </div>}
    </>
  );
}
