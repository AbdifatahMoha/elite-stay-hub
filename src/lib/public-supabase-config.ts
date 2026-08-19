import { createServerFn } from "@tanstack/react-start";

function runtimeEnv(name: string): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[name]?.trim() ?? "";
}

function safeHost(url: string): string | null {
  try {
    return url ? new URL(url).host : null;
  } catch {
    return "(invalid URL)";
  }
}

/** Server-only public config. Never includes SUPABASE_SERVICE_ROLE_KEY. */
export function readRuntimePublicSupabaseEnv() {
  const supabaseUrl = runtimeEnv("VITE_SUPABASE_URL") || runtimeEnv("SUPABASE_URL");
  const supabaseAnonKey = runtimeEnv("VITE_SUPABASE_ANON_KEY") || runtimeEnv("SUPABASE_ANON_KEY");
  return { supabaseUrl, supabaseAnonKey };
}

export const getPublicSupabaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const cfg = readRuntimePublicSupabaseEnv();
  const bakedUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  const bakedAnon = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
  console.info("[EliteStay] public supabase config", {
    runtimeUrlSet: Boolean(cfg.supabaseUrl),
    runtimeAnonSet: Boolean(cfg.supabaseAnonKey),
    runtimeUrlHost: safeHost(cfg.supabaseUrl),
    bakedViteUrlSet: Boolean(bakedUrl),
    bakedViteAnonSet: Boolean(bakedAnon),
  });
  return {
    supabaseUrl: cfg.supabaseUrl || bakedUrl,
    supabaseAnonKey: cfg.supabaseAnonKey || bakedAnon,
  };
});
