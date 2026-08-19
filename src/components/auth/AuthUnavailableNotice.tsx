import { getSupabaseConfigStatus, isSupabaseConfigured } from "@/lib/supabase";

/** Shown on auth pages only when Supabase is not connected. */
export function AuthUnavailableNotice() {
  if (isSupabaseConfigured()) return null;

  const status = getSupabaseConfigStatus();

  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground"
    >
      <p>Account registration and sign-in are temporarily unavailable. Please try again later or contact the hotel.</p>
      {status.message ? (
        <p className="mt-2 font-mono text-xs text-foreground/80">{status.message}</p>
      ) : null}
    </div>
  );
}
