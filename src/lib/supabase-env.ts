export type PublicSupabaseEnv = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

declare global {
  interface Window {
    __ELITESTAY_PUBLIC__?: PublicSupabaseEnv;
  }
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function fromProcess(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  return process.env[name];
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
  return Boolean(
    !url ||
      !anonKey ||
      url.includes("your-project") ||
      anonKey === "your-anon-key" ||
      anonKey.includes("your-anon"),
  );
}
