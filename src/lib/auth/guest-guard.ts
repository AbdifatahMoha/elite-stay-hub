import { redirect } from "@tanstack/react-router";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchProfile } from "@/services/profiles.service";
import { isGuest } from "@/lib/auth/roles";
import type { Profile } from "@/types/database";

export type GuestAuthContext = {
  profile: Profile;
  userId: string;
};

export async function requireGuestAuth(): Promise<GuestAuthContext> {
  if (!isSupabaseConfigured()) {
    throw redirect({ to: "/signin" });
  }

  const supabase = getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw redirect({ to: "/signin" });
  }

  const profile = await fetchProfile(session.user.id);
  if (!isGuest(profile)) {
    throw redirect({ to: "/signin" });
  }

  return { profile: profile!, userId: session.user.id };
}
