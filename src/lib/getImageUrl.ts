import type { SyntheticEvent } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/** Supabase Storage bucket for room type and room photos. */
export const HOTEL_ASSETS_BUCKET = "hotel-assets";

/**
 * Resolve a DB image value into a usable `src`, or `null` when missing/unresolvable.
 * Does not inject a stock placeholder photo.
 */
export function resolveImageSrc(image?: string | null): string | null {
  const value = image?.trim();
  if (!value) return null;

  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/") || value.startsWith("data:") || value.startsWith("blob:")) return value;

  if (isSupabaseConfigured()) {
    const path = normalizeStoragePath(value);
    const { data } = getSupabase().storage.from(HOTEL_ASSETS_BUCKET).getPublicUrl(path);
    if (data.publicUrl) return data.publicUrl;
  }

  return null;
}

/**
 * Resolve a room/property image value from the database into a usable `src`.
 * Returns empty string when none — UI should show a neutral empty state, not stock art.
 */
export function getImageUrl(image?: string | null): string {
  return resolveImageSrc(image) ?? "";
}

/** Strip bucket prefix if the DB stored a full storage key. */
export function normalizeStoragePath(path: string): string {
  return path.replace(/^\/+/, "").replace(new RegExp(`^${HOTEL_ASSETS_BUCKET}/`), "");
}

/** Hide broken images instead of swapping in a fake stock bedroom photo. */
export function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === "true") return;
  img.dataset.fallbackApplied = "true";
  img.style.display = "none";
  img.removeAttribute("src");
}
