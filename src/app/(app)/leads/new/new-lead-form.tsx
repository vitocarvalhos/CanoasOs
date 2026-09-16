"use client";

import { useActionState, type InputHTMLAttributes } from "react";
import { createLeadAction } from "@/app/(app)/actions";
import { initialActionState } from "@/lib/action-state";
import { stageOptions, temperatureLabels } from "@/lib/crm";
import type { CatalogCategory } from "@/lib/crm";
import { CatalogInput } from "@/components/catalog-input";
import { DateTimeFields } from "@/components/date-time-fields";

export function NewLeadForm({ catalogs }: { catalogs: Record<CatalogCategory, string[]> }) {
  const [state, formAction, pending] = useActionState(createLeadAction, initialActionState);
  return (
    <form action={formAction} className="space-y-5">
      <section className="panel p-5 sm:p-7">
        <h2 className="text-sm font-semibold">Contato</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Nome *" name="name" required />
          <Field label="Empresa" name="company" />
          <Field label="WhatsApp" name="whatsapp" type="tel" placeholder="(11) 99999-9999" />
          <CatalogInput label="Nicho" name="niche" options={catalogs.niche} placeholder="Busque ou crie uma opção" />
          <CatalogInput label="Origem" name="source" options={catalogs.source} placeholder="Busque ou crie uma opção" />
          <CatalogInput label="Serviço de interesse" name="service_interest" options={catalogs.service_interest} placeholder="Busque ou crie uma opção" />
          <Field label="Valor potencial" name="potential_value" type="number" min="0" step="0.01" placeholder="1500" />
          <div><label className="label" htmlFor="temperature">Temperatura</label><select className="field" id="temperature" name="temperature" defaultValue="cold">{Object.entries(temperatureLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label className="label" htmlFor="stage">Estágio inicial</label><select className="field" id="stage" name="stage" defaultValue="new">{stageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        </div>
      </section>

      <section className="panel p-5 sm:p-7">
        <h2 className="text-sm font-semibold">Contexto comercial</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="problem">Problema principal</label><textarea className="field min-h-24" id="problem" name="problem" /></div>
          <div><label className="label" htmlFor="objection">Objeção principal</label><textarea className="field min-h-24" id="objection" name="objection" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="notes">Resumo</label><textarea className="field min-h-24" id="notes" name="notes" placeholder="O que está acontecendo com essa oportunidade?" /></div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-400/25 bg-[#0d1826] p-5 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-300">Obrigatório</p>
        <h2 className="mt-2 text-lg font-semibold">Primeira próxima ação</h2>
        <p className="mt-2 text-sm text-slate-500">Sem isso o lead não entra no pipeline.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <CatalogInput label="O que fazer? *" name="task_title" options={catalogs.action_type} placeholder="Busque ou crie um tipo de ação" required />
          <DateTimeFields />
        </div>
      </section>
      {state.error && <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{state.error}</p>}
      <div className="flex justify-end"><button className="primary-button min-w-36" disabled={pending}>{pending ? "Criando…" : "Criar lead"}</button></div>
    </form>
  );
}

function Field({ label, name, type = "text", ...props }: { label: string; name: string; type?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <div><label className="label" htmlFor={name}>{label}</label><input className="field" id={name} name={name} type={type} {...props} /></div>;
}
