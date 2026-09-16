import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { getActionQueue } from "@/lib/action-queue";
import { todayBounds } from "@/lib/format";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) redirect("/login");

  const email = typeof claims.email === "string" ? claims.email : "Conta Canoas";
  let { data: profile } = await supabase.from("profiles").select("full_name").eq("id", claims.sub).maybeSingle();
  if (!profile) {
    const { data: createdProfile } = await supabase.from("profiles").insert({ id: claims.sub, full_name: email.split("@")[0] }).select("full_name").single();
    profile = createdProfile;
  }
  const name = profile?.full_name || email.split("@")[0];
  const { start, end } = todayBounds();
  const queue = await getActionQueue(supabase, { before: end });
  const actionSummary = {
    overdue: queue.filter((task) => task.due_at < start).length,
    today: queue.filter((task) => task.due_at >= start).length,
    tasks: queue.slice(0, 12).map((task) => ({ id: task.id, leadId: task.lead_id, leadName: task.leads.name, title: task.title, dueAt: task.due_at, overdue: task.due_at < start })),
  };
  return <AppShell email={email} name={name} actionSummary={actionSummary}>{children}</AppShell>;
}
