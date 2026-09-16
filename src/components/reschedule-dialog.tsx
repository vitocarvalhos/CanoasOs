"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { rescheduleTaskAction } from "@/app/(app)/actions";
import { initialActionState } from "@/lib/action-state";
import { localInputParts } from "@/lib/format";
import { CalendarClock, X } from "@/components/icons";

export function RescheduleDialog({ taskId, leadId, title, dueAt }: { taskId: string; leadId: string; title: string; dueAt: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const action = rescheduleTaskAction.bind(null, taskId, leadId);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const parts = localInputParts(dueAt);
  useEffect(() => { if (state.success) router.refresh(); }, [state.success, router]);
  return <>
    <button className="ghost-button" onClick={() => setOpen(true)}><CalendarClock size={15} /> Reagendar</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#10141b] p-6" role="dialog" aria-modal="true">
      <div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-300">Reagendar</p><h2 className="mt-2 text-xl font-semibold">Atualize a próxima ação</h2></div><button onClick={() => setOpen(false)} aria-label="Fechar"><X size={18} /></button></div>
      <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Ação</label><input className="field" name="title" defaultValue={title} required /></div>
        <div><label className="label">Data</label><input className="field" name="due_date" type="date" defaultValue={parts.date} required /></div>
        <div><label className="label">Horário</label><input className="field" name="due_time" type="time" defaultValue={parts.time} required /></div>
        <p className="text-xs text-slate-600 sm:col-span-2">America/Sao_Paulo</p>
        {state.error && <p className="text-sm text-red-300 sm:col-span-2">{state.error}</p>}
        {state.success && <p className="text-sm text-emerald-300 sm:col-span-2">{state.success}</p>}
        <button className="primary-button sm:col-span-2" disabled={pending}>{pending ? "Salvando…" : "Confirmar reagendamento"}</button>
      </form>
    </div></div>}
  </>;
}
