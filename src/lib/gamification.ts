import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { todayBounds } from "@/lib/format";

const xpByEvent: Record<string, number> = { "task.completed": 20, "lead.created": 15, "lead.stage_changed": 10, "task.created": 5, "lead.note_added": 3 };

export async function getGamification(client: SupabaseClient<Database>) {
  const { start } = todayBounds();
  const { data } = await client.from("activities").select("event_type,created_at").not("event_type", "is", null).order("created_at", { ascending: false }).limit(1000);
  const events = data ?? [];
  const today = events.filter((event) => event.created_at >= start);
  const completed = today.filter((event) => event.event_type === "task.completed").length;
  const movements = today.filter((event) => event.event_type === "lead.stage_changed").length;
  const created = today.filter((event) => event.event_type === "lead.created").length;
  const activeDays = new Set(events.filter((event) => ["task.completed", "lead.created", "lead.stage_changed"].includes(event.event_type ?? "")).map((event) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(event.created_at))));
  let streak = 0;
  const cursor = new Date();
  while (activeDays.has(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  const xp = events.reduce((sum, event) => sum + (xpByEvent[event.event_type ?? ""] ?? 0), 0);
  const missions = [
    { label: "Concluir 3 ações", progress: Math.min(completed, 3), target: 3 },
    { label: "Avançar 2 oportunidades", progress: Math.min(movements, 2), target: 2 },
    { label: "Criar 1 lead com próxima ação", progress: Math.min(created, 1), target: 1 },
  ];
  const achievements = [
    xp >= 100 && "Primeiros 100 XP",
    completed >= 5 && "Dia de execução",
    streak >= 3 && "Sequência de 3 dias",
    xp >= 500 && "Motor comercial",
  ].filter(Boolean) as string[];
  return { xp, streak, completed, missions, achievements };
}
