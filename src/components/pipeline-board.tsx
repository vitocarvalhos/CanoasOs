"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { archiveLeadAction, moveLeadStageAction, restoreLeadAction } from "@/app/(app)/actions";
import { pipelineColumns, stageDefinitions, stageLabels, stagesForGroup, type PipelineGroupId } from "@/lib/crm";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Lead, LeadStage, Task } from "@/lib/database.types";
import { TemperatureBadge } from "@/components/status";
import { X } from "@/components/icons";

type BoardLead = Lead & { nextTask: Task | null };

export function PipelineBoard({ initialLeads }: { initialLeads: BoardLead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [dragging, setDragging] = useState<string | null>(null);
  const [destination, setDestination] = useState<{ leadId: string; group: PipelineGroupId } | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [cancelTasks, setCancelTasks] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string; undoId?: string } | null>(null);
  const pending = useRef(new Set<string>());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 7 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }), useSensor(KeyboardSensor));

  function onDragStart(event: DragStartEvent) { setDragging(String(event.active.id)); }
  function onDragEnd(event: DragEndEvent) {
    setDragging(null);
    const leadId = String(event.active.id);
    const target = event.over?.id ? String(event.over.id) : "";
    if (!target) return;
    if (target === "archive") { setArchiving(leadId); return; }
    if (target.startsWith("group:")) setDestination({ leadId, group: target.slice(6) as PipelineGroupId });
  }

  async function move(leadId: string, stage: LeadStage) {
    if (pending.current.has(leadId)) return;
    const previous = leads;
    pending.current.add(leadId);
    setDestination(null);
    setLeads((items) => items.map((lead) => lead.id === leadId ? { ...lead, stage } : lead));
    const result = await moveLeadStageAction(leadId, stage, crypto.randomUUID());
    pending.current.delete(leadId);
    if (result.error) { setLeads(previous); setMessage({ tone: "error", text: result.error }); }
    else setMessage({ tone: "ok", text: result.success ?? "Estágio atualizado." });
  }

  async function archive() {
    if (!archiving || pending.current.has(archiving)) return;
    const id = archiving;
    pending.current.add(id);
    setArchiving(null);
    const previous = leads;
    setLeads((items) => items.filter((lead) => lead.id !== id));
    const result = await archiveLeadAction(id, cancelTasks, crypto.randomUUID());
    pending.current.delete(id);
    if (result.error) { setLeads(previous); setMessage({ tone: "error", text: result.error }); }
    else setMessage({ tone: "ok", text: result.success ?? "Lead arquivado.", undoId: cancelTasks ? undefined : id });
    setCancelTasks(false);
  }

  async function undo(leadId: string) {
    const result = await restoreLeadAction(leadId);
    if (result.error) setMessage({ tone: "error", text: result.error });
    else { const lead = initialLeads.find((item) => item.id === leadId); if (lead) setLeads((items) => [lead, ...items]); setMessage({ tone: "ok", text: "Lead restaurado." }); }
  }

  return <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
    <div className="-mx-4 overflow-x-auto px-4 pb-5 sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10"><div className="grid min-w-[1320px] grid-cols-6 gap-3">
      {pipelineColumns.map((column) => <PipelineColumn key={column.id} id={column.id} title={column.title} leads={leads.filter((lead) => column.stages.includes(lead.stage))} onMove={move} />)}
    </div></div>
    {dragging && <ArchiveZone />}
    {destination && <StagePicker group={destination.group} onClose={() => setDestination(null)} onPick={(stage) => move(destination.leadId, stage)} />}
    {archiving && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl border border-red-400/20 bg-[#11151c] p-6"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-300">Remover da pipeline</p><h2 className="mt-2 text-xl font-semibold">Arquivar este lead?</h2></div><button onClick={() => setArchiving(null)} aria-label="Fechar"><X size={18} /></button></div><p className="mt-4 text-sm leading-6 text-slate-400">Arquivar retira o card da pipeline e preserva lead e timeline. Marcar como perdido muda o estágio e mantém o card em Fechados.</p><label className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 p-4 text-sm"><input type="checkbox" checked={cancelTasks} onChange={(event) => setCancelTasks(event.target.checked)} /><span><strong className="block text-white">Cancelar ações futuras</strong><span className="mt-1 block text-xs text-slate-500">Se desmarcado, as tarefas permanecem para uma eventual restauração.</span></span></label><div className="mt-6 flex justify-end gap-2"><button className="ghost-button" onClick={() => setArchiving(null)}>Cancelar</button><button className="primary-button" onClick={archive}>Arquivar lead</button></div></div></div>}
    {message && <div role="status" className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl ${message.tone === "error" ? "border-red-400/30 bg-red-950 text-red-100" : "border-emerald-400/30 bg-emerald-950 text-emerald-100"}`}>{message.text}{message.undoId && <button className="font-bold underline" onClick={() => undo(message.undoId!)}>Desfazer</button>}<button onClick={() => setMessage(null)} aria-label="Fechar"><X size={15} /></button></div>}
  </DndContext>;
}

function PipelineColumn({ id, title, leads, onMove }: { id: PipelineGroupId; title: string; leads: BoardLead[]; onMove: (id: string, stage: LeadStage) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `group:${id}` });
  const total = leads.reduce((sum, lead) => sum + Number(lead.potential_value), 0);
  return <section ref={setNodeRef} className={`rounded-2xl border p-3 transition ${isOver ? "border-blue-400/60 bg-blue-500/10" : "border-white/10 bg-[#0b0e13]"}`}><header className="mb-3 border-b border-white/[.07] px-1 pb-3"><div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-[.12em] text-slate-300">{title}</h2><span className="rounded-full bg-white/[.07] px-2 py-0.5 text-[10px] text-slate-400">{leads.length}</span></div><p className="mt-1.5 text-[11px] text-slate-600">{formatMoney(total)}</p></header><div className="space-y-2.5">{leads.map((lead) => <LeadCard key={lead.id} lead={lead} onMove={onMove} />)}{!leads.length && <p className="px-2 py-8 text-center text-xs text-slate-700">Solte um lead aqui</p>}</div></section>;
}

function LeadCard({ lead, onMove }: { lead: BoardLead; onMove: (id: string, stage: LeadStage) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const overdue = lead.nextTask && new Date(lead.nextTask.due_at) < new Date();
  return <article ref={setNodeRef} style={style} className={`rounded-xl border border-white/10 bg-[#12161d] p-3.5 shadow-sm ${isDragging ? "z-40 opacity-60 ring-2 ring-blue-400" : ""}`}>
    <button {...listeners} {...attributes} className="w-full cursor-grab text-left active:cursor-grabbing" aria-label={`Arrastar ${lead.name}`}><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold leading-5">{lead.name}</p><TemperatureBadge value={lead.temperature} /></div><p className="mt-1 truncate text-xs text-slate-500">{lead.company || stageLabels[lead.stage]}</p></button>
    <Link href={`/leads/${lead.id}`} className="mt-2 block text-[10px] text-blue-300 hover:underline">Abrir ficha</Link>
    <div className={`mt-3 rounded-lg border px-2.5 py-2 ${!lead.nextTask || overdue ? "border-red-400/20 bg-red-500/[.05]" : "border-white/[.07] bg-black/20"}`}><p className={`truncate text-[11px] ${!lead.nextTask || overdue ? "text-red-300" : "text-slate-400"}`}>{lead.nextTask?.title ?? "Sem próxima ação"}</p>{lead.nextTask && <p className="mt-1 text-[10px] text-slate-600">{formatDateTime(lead.nextTask.due_at)}</p>}</div>
    <div className="mt-3 flex gap-1.5"><select aria-label="Mover para estágio" value={lead.stage} onChange={(event) => onMove(lead.id, event.target.value as LeadStage)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0b0e13] px-2 py-1.5 text-[10px] text-slate-400 outline-none">{stageDefinitions.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></div>
  </article>;
}

function ArchiveZone() { const { setNodeRef, isOver } = useDroppable({ id: "archive" }); return <div ref={setNodeRef} className={`fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-2xl border px-8 py-4 text-sm font-bold shadow-2xl transition ${isOver ? "scale-105 border-red-300 bg-red-500 text-white" : "border-red-400/30 bg-red-950/95 text-red-200"}`}>Remover da pipeline</div>; }

function StagePicker({ group, onClose, onPick }: { group: PipelineGroupId; onClose: () => void; onPick: (stage: LeadStage) => void }) { const options = useMemo(() => stagesForGroup(group), [group]); return <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11151c] p-6"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-300">Destino interno</p><h2 className="mt-2 text-xl font-semibold">Escolha o subestágio</h2></div><button onClick={onClose} aria-label="Fechar"><X size={18} /></button></div><div className="mt-5 grid gap-2">{options.map((stage) => <button key={stage.id} className="rounded-xl border border-white/10 px-4 py-3 text-left text-sm font-semibold hover:border-blue-400/50 hover:bg-blue-500/10" onClick={() => onPick(stage.id)}>{stage.label}</button>)}</div></div></div>; }
