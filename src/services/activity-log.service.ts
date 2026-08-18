import { getSupabase } from "@/lib/supabase";

export async function logActivity(input: {
  actor_id?: string | null;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabase();
  const { error } = await supabase.from("activity_logs").insert({
    actor_id: input.actor_id ?? null,
    action: input.action,
    entity_type: input.entity_type ?? null,
    entity_id: input.entity_id ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}

export async function fetchActivityLogs(limit = 50) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*, actor:profiles(full_name, email, role)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
