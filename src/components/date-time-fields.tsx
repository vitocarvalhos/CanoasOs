export function DateTimeFields({ prefix = "due", defaultDate = "", defaultTime = "" }: { prefix?: string; defaultDate?: string; defaultTime?: string }) {
  return <div className="sm:col-span-2">
    <div className="grid gap-3 sm:grid-cols-2">
      <div><label className="label" htmlFor={`${prefix}_date`}>Data *</label><input className="field" id={`${prefix}_date`} name={`${prefix}_date`} type="date" defaultValue={defaultDate} required /></div>
      <div><label className="label" htmlFor={`${prefix}_time`}>Horário *</label><input className="field" id={`${prefix}_time`} name={`${prefix}_time`} type="time" defaultValue={defaultTime} required /></div>
    </div>
    <p className="mt-2 text-xs text-slate-600">Horário de Brasília (America/Sao_Paulo)</p>
  </div>;
}
