"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeTaskAction } from "@/app/(app)/actions";
import { initialActionState } from "@/lib/action-state";
import { defaultLocalDateTime } from "@/lib/format";
import { outcomes, type Outcome } from "@/lib/crm";
import { Check, X } from "@/components/icons";

export function OutcomeDialog({ taskId, leadId }: { taskId: string; leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | "">("");
  const [nextTitle, setNextTitle] = useState("");
  const [nextDueAt, setNextDueAt] = useState("");
  const boundAction = completeTaskAction.bind(null, taskId, leadId);
  const [state, formAction, pending] = useActionState(boundAction, initialActionState);
  const terminal = outcome === "not_interested" || outcome === "sale";

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  function choose(value: Outcome) {
    const item = outcomes.find((candidate) => candidate.value === value)!;
    setOutcome(value);
    setNextTitle(item.nextTitle);
    setNextDueAt(item.days ? defaultLocalDateTime(item.days) : "");
  }

  return (
    <>
      <button className="primary-button flex-1 sm:flex-none" onClick={() => setOpen(true)}><Check size={16} /> Concluir</button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" role="presentation">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#10141b] p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="outcome-title">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-400">Conclusão obrigatória</p>
                <h2 id="outcome-title" className="mt-2 text-2xl font-semibold tracking-tight">O que aconteceu?</h2>
              </div>
              <button className="grid size-9 place-items-center rounded-full border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white" onClick={() => setOpen(false)} aria-label="Fechar"><X size={17} /></button>
            </div>

            <form action={formAction} className="mt-6">
              <input type="hidden" name="outcome" value={outcome} />
              <div className="grid gap-2 sm:grid-cols-2">
                {outcomes.map((item) => (
                  <button key={item.value} type="button" onClick={() => choose(item.value)} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${outcome === item.value ? "border-blue-400/60 bg-blue-500/15 text-white" : "border-white/10 bg-white/[.025] text-slate-400 hover:border-white/20 hover:text-white"}`}>
                    {item.label}
                  </button>
                ))}
              </div>

              {outcome && !terminal && (
                <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor={`next-title-${taskId}`}>Próxima ação</label>
                    <input id={`next-title-${taskId}`} className="field" name="next_title" value={nextTitle} onChange={(event) => setNextTitle(event.target.value)} required />
                  </div>
                  <div>
                    <label className="label" htmlFor={`next-date-${taskId}`}>Data e hora</label>
                    <input id={`next-date-${taskId}`} className="field" name="next_due_at" type="datetime-local" value={nextDueAt} onChange={(event) => setNextDueAt(event.target.value)} required />
                  </div>
                </div>
              )}

              {outcome && (
                <div className="mt-4">
                  <label className="label" htmlFor={`details-${taskId}`}>{terminal ? "Motivo ou contexto" : "Observação (opcional)"}</label>
                  <textarea id={`details-${taskId}`} className="field min-h-20 resize-y" name="details" placeholder="Registre o contexto para a próxima conversa" required={outcome === "not_interested"} />
                </div>
              )}
              {state.error && <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</p>}
              <button className="primary-button mt-6 w-full" disabled={!outcome || pending}>{pending ? "Salvando…" : "Confirmar conclusão"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
