export type PublicSupabaseEnv = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

declare global {
  interface Window {
    __ELITESTAY_PUBLIC__?: PublicSupabaseEnv;
  }
}

function firstNonEmpty(...values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function fromProcess(name: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[name];
}

export function applyPublicSupabaseEnv(cfg: PublicSupabaseEnv | null | undefined) {
  if (typeof window === "undefined") return;
  const supabaseUrl = cfg?.supabaseUrl?.trim();
  const supabaseAnonKey = cfg?.supabaseAnonKey?.trim();
  if (!supabaseUrl || !supabaseAnonKey) return;
  window.__ELITESTAY_PUBLIC__ = { supabaseUrl, supabaseAnonKey };
}

/** Public URL + anon key. Safe for the browser. Never includes the service role key. */
export function readPublicSupabaseEnv(): { url?: string; anonKey?: string } {
  const injected = typeof window !== "undefined" ? window.__ELITESTAY_PUBLIC__ : undefined;

  return {
    url: firstNonEmpty(
      injected?.supabaseUrl,
      fromProcess("VITE_SUPABASE_URL"),
      fromProcess("SUPABASE_URL"),
      import.meta.env.VITE_SUPABASE_URL as string | undefined,
    ),
    anonKey: firstNonEmpty(
      injected?.supabaseAnonKey,
      fromProcess("VITE_SUPABASE_ANON_KEY"),
      fromProcess("SUPABASE_ANON_KEY"),
      import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
    ),
  };
}

export function getPublicAppUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const appUrl = firstNonEmpty(fromProcess("APP_URL"));
  if (appUrl) return appUrl.replace(/\/$/, "");
  const railwayDomain = firstNonEmpty(fromProcess("RAILWAY_PUBLIC_DOMAIN"));
  if (railwayDomain) {
    return railwayDomain.startsWith("http") ? railwayDomain.replace(/\/$/, "") : `https://${railwayDomain}`;
  }
  return "";
}

export function isPlaceholderSupabaseValue(url?: string, anonKey?: string): boolean {
  if (!url || !anonKey) return false;
  return (
    url.includes("your-project") ||
    anonKey === "your-anon-key" ||
    anonKey.includes("your-anon")
  );
}

export function logClientEnvProbe(reason: string) {
  const bakedUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  const bakedAnon = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
  const injected = typeof window !== "undefined" ? window.__ELITESTAY_PUBLIC__ : undefined;
  const { url, anonKey } = readPublicSupabaseEnv();
  console.info(`[EliteStay] env probe (${reason})`, {
    bakedViteUrlSet: Boolean(bakedUrl),
    bakedViteAnonSet: Boolean(bakedAnon),
    injectedUrlSet: Boolean(injected?.supabaseUrl),
    injectedAnonSet: Boolean(injected?.supabaseAnonKey),
    resolvedUrlSet: Boolean(url),
    resolvedAnonSet: Boolean(anonKey),
    resolvedUrlHost: url
      ? (() => {
          try {
            return new URL(url).host;
          } catch {
            return "(invalid URL)";
          }
        })()
      : null,
  });
}
