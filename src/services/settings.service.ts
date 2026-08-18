import { getSupabase } from "@/lib/supabase";
import type { HotelSettings } from "@/types/database";

export async function fetchHotelSettings(): Promise<HotelSettings | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("hotel_settings").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data as HotelSettings | null;
}

export async function updateHotelSettings(id: string, patch: Partial<Omit<HotelSettings, "id">>) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("hotel_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as HotelSettings;
}
