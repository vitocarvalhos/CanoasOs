import type { LeadStage, LeadTemperature } from "@/lib/database.types";

export const stageLabels: Record<LeadStage, string> = {
  new: "Novo lead",
  contact_attempt: "Tentativa de contato",
  conversation: "Em conversa",
  qualified: "Qualificado",
  meeting_scheduled: "Reunião marcada",
  meeting_done: "Reunião realizada",
  proposal: "Proposta apresentada",
  decision: "Em decisão",
  follow_up: "Follow-up",
  won: "Fechado ganho",
  lost: "Fechado perdido",
  nurture: "Nutrição futura",
};

export const stageOptions = Object.entries(stageLabels) as [LeadStage, string][];

export const temperatureLabels: Record<LeadTemperature, string> = {
  cold: "Frio",
  warm: "Morno",
  hot: "Quente",
};

export const pipelineColumns: { title: string; stages: LeadStage[] }[] = [
  { title: "Novos", stages: ["new", "contact_attempt"] },
  { title: "Conversa", stages: ["conversation", "qualified"] },
  { title: "Reunião", stages: ["meeting_scheduled", "meeting_done"] },
  { title: "Proposta", stages: ["proposal", "decision"] },
  { title: "Follow-up", stages: ["follow_up", "nurture"] },
  { title: "Fechados", stages: ["won", "lost"] },
];

export const outcomes = [
  { value: "responded", label: "Respondeu", nextTitle: "Continuar qualificação", days: 1 },
  { value: "no_response", label: "Não respondeu", nextTitle: "Nova tentativa de contato", days: 2 },
  { value: "meeting_scheduled", label: "Reunião marcada", nextTitle: "Confirmar reunião", days: 1 },
  { value: "talk_later", label: "Pediu para falar depois", nextTitle: "Retomar contato", days: 3 },
  { value: "not_interested", label: "Não tem interesse", nextTitle: "", days: 0 },
  { value: "sale", label: "Venda realizada", nextTitle: "", days: 0 },
] as const;

export type Outcome = (typeof outcomes)[number]["value"];

export function whatsappUrl(phone: string | null, name?: string) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const text = encodeURIComponent(`Olá${name ? `, ${name}` : ""}! Tudo bem?`);
  return digits ? `https://wa.me/${number}?text=${text}` : "#";
}
