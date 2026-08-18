import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseConfigStatus = {
  configured: boolean;
  missing: string[];
  hasPlaceholderValues: boolean;
  message: string | null;
};

function readClientEnv() {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  return { url, anonKey };
}

function isPlaceholder(url?: string, anonKey?: string) {
  return (
    !url ||
    !anonKey ||
    url.includes("your-project") ||
    anonKey === "your-anon-key" ||
    anonKey.includes("your-anon")
  );
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const { url, anonKey } = readClientEnv();
  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!anonKey) missing.push("VITE_SUPABASE_ANON_KEY");

  const hasPlaceholderValues = isPlaceholder(url, anonKey);
  const configured = Boolean(url && anonKey && url.startsWith("http") && !hasPlaceholderValues);

  let message: string | null = null;
  if (!configured) {
    if (missing.length) {
      message = `Missing ${missing.join(" and ")}. Copy .env.example to .env and add your Supabase project credentials.`;
    } else if (hasPlaceholderValues) {
      message = "Replace placeholder values in .env with your real Supabase project URL and anon key.";
    } else if (url && !url.startsWith("http")) {
      message = "VITE_SUPABASE_URL must start with https://";
    }
  }

  return { configured, missing, hasPlaceholderValues, message };
}

/** Logs configuration warnings to the browser console in development only. */
export function logSupabaseConfigWarning(): void {
  if (!import.meta.env.DEV || typeof window === "undefined") return;
  const status = getSupabaseConfigStatus();
  if (!status.configured && status.message) {
    console.warn(`[EliteStay] ${status.message}`);
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().configured;
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
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
