import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getServerSupabaseConfigStatus() {
  const url = (process.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL)?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  const configured = Boolean(
    url && serviceKey && url.startsWith("http") && !serviceKey.includes("your-service"),
  );
  return { configured, missing, url, serviceKey };
}

export function getSupabaseAdmin(): SupabaseClient {
  const { configured, missing, url, serviceKey } = getServerSupabaseConfigStatus();
  if (!configured) {
    throw new Error(
      `Staff invitation requires server credentials. Set ${missing.join(" and ")} in .env (never expose the service role key to the browser).`,
    );
  }
  return createClient(url!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
