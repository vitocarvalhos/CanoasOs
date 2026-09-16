import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Lead, Task } from "@/lib/database.types";

export type TaskWithLead = Task & {
  leads: Pick<Lead, "id" | "name" | "company" | "whatsapp" | "notes" | "temperature" | "stage">;
};

export async function getActionQueue(client: SupabaseClient<Database>, options?: { before?: string; includeCompleted?: boolean }) {
  let query = client
    .from("tasks")
    .select("*, leads!inner(id,name,company,whatsapp,notes,temperature,stage,archived_at)")
    .order("due_at", { ascending: true });
  if (!options?.includeCompleted) query = query.is("completed_at", null);
  if (options?.before) query = query.lt("due_at", options.before);
  const { data, error } = await query.is("leads.archived_at", null);
  if (error) throw error;
  return (data ?? []) as unknown as TaskWithLead[];
}
