/** Collect unique non-empty image URLs, preserving order. */
export function collectImageUrls(...sources: Array<string | string[] | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const source of sources) {
    const list = Array.isArray(source) ? source : source ? [source] : [];
    for (const url of list) {
      const trimmed = url?.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        out.push(trimmed);
      }
    }
  }
  return out;
}

/** Cover image is the first gallery URL (or legacy single URL). */
export function coverFromImages(urls: string[], fallback?: string | null): string | null {
  return urls[0] ?? fallback?.trim() ?? null;
}

/** Keep cover field in sync with gallery for older consumers. */
export function syncCoverFields(imageUrls: string[]) {
  const urls = collectImageUrls(imageUrls);
  return {
    image_urls: urls,
    image_url: urls[0] ?? null,
  };
}
