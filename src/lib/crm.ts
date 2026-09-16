import type { LeadStage, LeadTemperature } from "@/lib/database.types";

export type PipelineGroupId = "new" | "conversation" | "meeting" | "proposal" | "follow_up" | "closed";

export type StageDefinition = {
  id: LeadStage;
  label: string;
  group: PipelineGroupId;
  order: number;
  color: "slate" | "blue" | "violet" | "amber" | "cyan" | "emerald" | "red";
};

export const stageDefinitions: StageDefinition[] = [
  { id: "new", label: "Novo lead", group: "new", order: 10, color: "slate" },
  { id: "contact_attempt", label: "Tentativa de contato", group: "new", order: 20, color: "blue" },
  { id: "conversation", label: "Em conversa", group: "conversation", order: 30, color: "blue" },
  { id: "qualified", label: "Qualificado", group: "conversation", order: 40, color: "violet" },
  { id: "meeting_scheduled", label: "Reunião marcada", group: "meeting", order: 50, color: "violet" },
  { id: "meeting_no_show", label: "Não compareceu", group: "meeting", order: 60, color: "red" },
  { id: "meeting_done", label: "Reunião concluída", group: "meeting", order: 70, color: "emerald" },
  { id: "proposal", label: "Proposta apresentada", group: "proposal", order: 80, color: "amber" },
  { id: "decision", label: "Em decisão", group: "proposal", order: 90, color: "amber" },
  { id: "follow_up", label: "Primeiro follow-up", group: "follow_up", order: 100, color: "cyan" },
  { id: "follow_up_2", label: "Segundo follow-up", group: "follow_up", order: 110, color: "cyan" },
  { id: "follow_up_3", label: "Terceiro follow-up", group: "follow_up", order: 120, color: "cyan" },
  { id: "follow_up_4", label: "Quarto follow-up", group: "follow_up", order: 130, color: "cyan" },
  { id: "follow_up_5", label: "Quinto follow-up", group: "follow_up", order: 140, color: "cyan" },
  { id: "follow_up_6", label: "Sexto follow-up", group: "follow_up", order: 150, color: "cyan" },
  { id: "nurture", label: "Nutrição futura", group: "follow_up", order: 160, color: "slate" },
  { id: "won", label: "Fechado ganho", group: "closed", order: 170, color: "emerald" },
  { id: "lost", label: "Fechado perdido", group: "closed", order: 180, color: "red" },
];

export const stageLabels = Object.fromEntries(stageDefinitions.map((stage) => [stage.id, stage.label])) as Record<LeadStage, string>;
export const stageOptions = stageDefinitions.map((stage) => [stage.id, stage.label] as const);

const groupDefinitions: { id: PipelineGroupId; title: string }[] = [
  { id: "new", title: "Novos" },
  { id: "conversation", title: "Conversa" },
  { id: "meeting", title: "Reunião" },
  { id: "proposal", title: "Proposta" },
  { id: "follow_up", title: "Follow-up" },
  { id: "closed", title: "Fechados" },
];

export const pipelineColumns = groupDefinitions.map((group) => ({
  ...group,
  stages: stageDefinitions.filter((stage) => stage.group === group.id).map((stage) => stage.id),
}));

export function getStageDefinition(stage: LeadStage) {
  return stageDefinitions.find((definition) => definition.id === stage) ?? stageDefinitions[0];
}

export function stagesForGroup(group: PipelineGroupId) {
  return stageDefinitions.filter((stage) => stage.group === group);
}

export const followUpStages: LeadStage[] = ["follow_up", "follow_up_2", "follow_up_3", "follow_up_4", "follow_up_5", "follow_up_6"];

export function nextFollowUpStage(stage: LeadStage): LeadStage | null {
  const index = followUpStages.indexOf(stage);
  return index >= 0 && index < followUpStages.length - 1 ? followUpStages[index + 1] : null;
}

export const temperatureLabels: Record<LeadTemperature, string> = {
  cold: "Frio",
  warm: "Morno",
  hot: "Quente",
};

export const catalogCategories = ["niche", "service_interest", "source", "action_type"] as const;
export type CatalogCategory = (typeof catalogCategories)[number];

export const initialCatalogOptions: Record<CatalogCategory, string[]> = {
  niche: ["Clínicas e consultórios", "Imobiliárias", "Restaurantes", "Academias", "Escritórios", "E-commerce", "Serviços locais", "Educação"],
  service_interest: ["Site institucional", "Landing page", "Automação comercial", "Gestão de tráfego", "CRM", "Consultoria", "E-commerce"],
  source: ["Indicação", "Google Maps", "Instagram", "LinkedIn", "Prospecção ativa", "Evento", "Site", "Anúncio"],
  action_type: ["Primeiro contato por WhatsApp", "Nova tentativa de contato", "Ligação", "Enviar apresentação", "Enviar proposta", "Confirmar reunião", "Follow-up de proposta", "Recuperar no-show", "Pedir indicação", "Reativar oportunidade"],
};

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
