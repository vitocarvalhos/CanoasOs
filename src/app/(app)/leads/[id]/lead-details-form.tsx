"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Lead } from "@/lib/database.types";
import { addNoteAction, createTaskAction, updateLeadAction } from "@/app/(app)/actions";
import { initialActionState } from "@/lib/action-state";
import { stageOptions, temperatureLabels } from "@/lib/crm";
import type { CatalogCategory } from "@/lib/crm";
import { CatalogInput } from "@/components/catalog-input";
import { DateTimeFields } from "@/components/date-time-fields";

export function LeadDetailsForm({ lead, catalogs }: { lead: Lead; catalogs: Record<CatalogCategory, string[]> }) {
  const action = updateLeadAction.bind(null, lead.id);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  return (
    <details className="panel group p-5 sm:p-7">
      <summary className="cursor-pointer list-none text-sm font-semibold text-slate-300 marker:hidden">Editar dados comerciais <span className="ml-2 text-slate-600 group-open:hidden">+</span><span className="ml-2 hidden text-slate-600 group-open:inline">−</span></summary>
      <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nome" name="name" defaultValue={lead.name} required />
        <Field label="Empresa" name="company" defaultValue={lead.company ?? ""} />
        <Field label="WhatsApp" name="whatsapp" defaultValue={lead.whatsapp ?? ""} />
        <CatalogInput label="Nicho" name="niche" options={catalogs.niche} defaultValue={lead.niche ?? ""} />
        <CatalogInput label="Origem" name="source" options={catalogs.source} defaultValue={lead.source ?? ""} />
        <CatalogInput label="Serviço" name="service_interest" options={catalogs.service_interest} defaultValue={lead.service_interest ?? ""} />
        <Field label="Valor potencial" name="potential_value" type="number" defaultValue={String(lead.potential_value)} />
        <div><label className="label" htmlFor="stage">Estágio</label><select id="stage" name="stage" className="field" defaultValue={lead.stage}>{stageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div><label className="label" htmlFor="temperature">Temperatura</label><select id="temperature" name="temperature" className="field" defaultValue={lead.temperature}>{Object.entries(temperatureLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <Field label="Timing" name="timing" defaultValue={lead.timing ?? ""} />
        <Area label="Problema" name="problem" defaultValue={lead.problem ?? ""} />
        <Area label="Objeção" name="objection" defaultValue={lead.objection ?? ""} />
        <div className="sm:col-span-2"><Area label="Resumo" name="notes" defaultValue={lead.notes ?? ""} /></div>
        <div className="sm:col-span-2 flex items-center justify-between gap-3">
          <p className={`text-sm ${state.error ? "text-red-300" : "text-emerald-300"}`}>{state.error || state.success}</p>
          <button className="primary-button" disabled={pending}>{pending ? "Salvando…" : "Salvar alterações"}</button>
        </div>
      </form>
    </details>
  );
}

export function NoteForm({ leadId }: { leadId: string }) {
  const action = addNoteAction.bind(null, leadId);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) formRef.current?.reset(); }, [state.success]);
  return (
    <form ref={formRef} action={formAction} className="mt-5 flex flex-col gap-2 sm:flex-row">
      <input className="field flex-1" name="content" placeholder="Registrar observação rápida…" required />
      <button className="ghost-button" disabled={pending}>{pending ? "Salvando…" : "Adicionar"}</button>
      {state.error && <p className="text-xs text-red-300">{state.error}</p>}
    </form>
  );
}

export function NextTaskForm({ leadId, actionOptions }: { leadId: string; actionOptions: string[] }) {
  const action = createTaskAction.bind(null, leadId);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  return (
    <form action={formAction} className="mt-5 space-y-3">
      <CatalogInput label="Próxima ação" name="title" options={actionOptions} placeholder="Busque ou crie uma ação" required />
      <DateTimeFields />
      {state.error && <p className="text-xs text-red-300">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-300">{state.success}</p>}
      <button className="primary-button w-full" disabled={pending}>{pending ? "Criando…" : "Criar próxima ação"}</button>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue, required }: { label: string; name: string; type?: string; defaultValue: string; required?: boolean }) {
  return <div><label className="label" htmlFor={name}>{label}</label><input className="field" id={name} name={name} type={type} defaultValue={defaultValue} required={required} /></div>;
}
function Area({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return <div><label className="label" htmlFor={name}>{label}</label><textarea className="field min-h-24" id={name} name={name} defaultValue={defaultValue} /></div>;
}
