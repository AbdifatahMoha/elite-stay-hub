import { getSupabase } from "@/lib/supabase";
import type { Guest } from "@/types/database";

export async function fetchGuests(): Promise<Guest[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("guests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Guest[];
}

export async function fetchGuestById(id: string): Promise<Guest | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("guests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Guest | null;
}

export async function findGuestByEmail(email: string): Promise<Guest | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("guests").select("*").ilike("email", email).maybeSingle();
  if (error) throw error;
  return data as Guest | null;
}

export async function createGuest(input: Omit<Guest, "id" | "created_at" | "is_active">) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("guests").insert({ ...input, is_active: true }).select().single();
  if (error) throw error;
  return data as Guest;
}

export async function updateGuest(id: string, patch: Partial<Omit<Guest, "id" | "created_at">>) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("guests").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Guest;
}

export async function deactivateGuest(id: string) {
  return updateGuest(id, { is_active: false });
}
