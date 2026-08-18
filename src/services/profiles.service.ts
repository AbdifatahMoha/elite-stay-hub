import { getSupabase } from "@/lib/supabase";
import type { Profile, ProfileStatus, UserRole } from "@/types/database";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function fetchPendingStaff(): Promise<Profile[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or("role.eq.PENDING_STAFF,status.eq.PENDING")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function upsertProfileAfterSignup(
  userId: string,
  input: {
    email: string;
    full_name: string;
    phone: string | null;
    role: UserRole;
    status: ProfileStatus;
    position?: string | null;
  },
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email: input.email,
      full_name: input.full_name,
      phone: input.phone,
      role: input.role,
      status: input.status,
      position: input.position ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, "full_name" | "phone" | "role" | "status" | "avatar_url" | "position">>,
) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("profiles").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function approveStaffProfile(
  id: string,
  approverId: string,
  role: UserRole = "STAFF",
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      role,
      status: "ACTIVE",
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function rejectStaffProfile(id: string) {
  return updateProfile(id, { status: "DISABLED", role: "PENDING_STAFF" });
}

export async function resetStaffPassword(email: string, redirectPath = "/admin/login") {
  const supabase = getSupabase();
  const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:8080";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}${redirectPath}`,
  });
  if (error) throw error;
}
