import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { readPublicSupabaseEnv } from "@/lib/supabase-env";

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export function getServerSupabaseConfigStatus() {
  const { url } = readPublicSupabaseEnv();
  const serviceKey = firstNonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  const configured = Boolean(
    url && serviceKey && url.startsWith("http") && !serviceKey.includes("your-service"),
  );
  if (!configured) {
    console.error("[EliteStay] Supabase admin (server) is not configured", {
      missing,
      urlSet: Boolean(url),
      serviceRoleSet: Boolean(serviceKey),
    });
  }
  return { configured, missing, url, serviceKey };
}

export function getSupabaseAdmin(): SupabaseClient {
  const { configured, missing, url, serviceKey } = getServerSupabaseConfigStatus();
  if (!configured) {
    throw new Error(
      `Staff invitation requires server credentials. Set ${missing.join(" and ")} in Railway Variables (never expose SUPABASE_SERVICE_ROLE_KEY to the browser).`,
    );
  }
  return createClient(url!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
