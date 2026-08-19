import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { isPlaceholderSupabaseValue, readPublicSupabaseEnv } from "@/lib/supabase-env";

export type SupabaseConfigStatus = {
  configured: boolean;
  missing: string[];
  hasPlaceholderValues: boolean;
  message: string | null;
};

function readClientEnv() {
  return readPublicSupabaseEnv();
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const { url, anonKey } = readClientEnv();
  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!anonKey) missing.push("VITE_SUPABASE_ANON_KEY");

  const hasPlaceholderValues = isPlaceholderSupabaseValue(url, anonKey);
  const configured = Boolean(url && anonKey && url.startsWith("http") && !hasPlaceholderValues);

  let message: string | null = null;
  if (!configured) {
    if (missing.length) {
      message = `Missing ${missing.join(" and ")}. Set them in Railway → Variables (or local .env) and redeploy.`;
    } else if (hasPlaceholderValues) {
      message = "Replace placeholder Supabase values with the real project URL and anon key.";
    } else if (url && !url.startsWith("http")) {
      message = "VITE_SUPABASE_URL must start with https://";
    }
  }

  return { configured, missing, hasPlaceholderValues, message };
}

export function logSupabaseConfigWarning(): void {
  if (typeof console === "undefined") return;
  const status = getSupabaseConfigStatus();
  if (status.configured) {
    const { url } = readClientEnv();
    let urlHost: string | null = null;
    try {
      urlHost = url ? new URL(url).host : null;
    } catch {
      urlHost = "(invalid URL)";
    }
    console.info("[EliteStay] Supabase client connected", {
      urlHost,
      anonKeySet: true,
    });
    return;
  }
  console.error("[EliteStay] Supabase is not configured", {
    missing: status.missing,
    hasPlaceholderValues: status.hasPlaceholderValues,
    message: status.message,
  });
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().configured;
}

let client: SupabaseClient | null = null;

export function resetSupabaseClient() {
  client = null;
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    const status = getSupabaseConfigStatus();
    throw new Error(status.message ?? "Supabase is not configured.");
  }
  const { url, anonKey } = readClientEnv();
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
