import { isSupabaseConfigured } from "@/lib/supabase";

/** Shown on auth pages only when Supabase is not connected — no developer jargon. */
export function AuthUnavailableNotice() {
  if (isSupabaseConfigured()) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground"
    >
      Account registration and sign-in are temporarily unavailable. Please try again later or contact the hotel.
    </div>
  );
}
