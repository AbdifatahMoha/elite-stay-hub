import { redirect } from "@tanstack/react-router";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchProfile } from "@/services/profiles.service";
import { canAccessAdminRoute, isHotelStaff, isPendingStaff } from "@/lib/auth/roles";
import type { Profile } from "@/types/database";

export type AdminAuthContext = {
  profile: Profile;
  userId: string;
};

export async function requireAdminAuth(pathname: string): Promise<AdminAuthContext> {
  if (!isSupabaseConfigured()) {
    throw redirect({ to: "/admin/login" });
  }

  const supabase = getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw redirect({ to: "/admin/login", search: { redirect: pathname } });
  }

  const profile = await fetchProfile(session.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    throw redirect({ to: "/admin/login" });
  }

  if (isPendingStaff(profile)) {
    throw redirect({ to: "/staff/signup", search: { pending: "1" } });
  }

  if (!isHotelStaff(profile)) {
    await supabase.auth.signOut();
    throw redirect({ to: "/admin/login", search: { error: "unauthorized" } });
  }

  if (!canAccessAdminRoute(profile, pathname)) {
    throw redirect({ to: "/admin/dashboard" });
  }

  return { profile, userId: session.user.id };
}

export { canAccessRoute } from "@/lib/auth/roles";
