/**
 * 最近使ったギャラリー／検索条件（端末 localStorage）。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/galleryRecentQueries.test.ts
 *
 * キー接頭辞は `LOCAL_STORAGE_PREFIX`（brand.ts）と同じ `oshihaven:`。
 * このファイルは node テストから直接読まれるため brand を import しない。
 */

export const GALLERY_RECENT_QUERIES_KEY = "oshihaven:galleryRecentQueries";
export const GALLERY_RECENT_MAX = 8;

export type GalleryRecentQuery = {
  q?: string;
  category_tag_ids?: number[];
  storage_location_ids?: number[];
  color_tag_slots?: number[];
  sort?: string;
};

export type GalleryRecentEntry = {
  fingerprint: string;
  query: GalleryRecentQuery;
  label: string;
  saved_at: number;
};

function hasActiveFilters(query: GalleryRecentQuery): boolean {
  if (query.q?.trim()) return true;
  if ((query.category_tag_ids?.length ?? 0) > 0) return true;
  if ((query.storage_location_ids?.length ?? 0) > 0) return true;
  if ((query.color_tag_slots?.length ?? 0) > 0) return true;
  return false;
}

/** offset を除いた指紋（並びは含める）。 */
export function fingerprintGalleryQuery(query: GalleryRecentQuery): string {
  const parts = [
    query.q?.trim() ?? "",
    (query.category_tag_ids ?? []).join(","),
    (query.storage_location_ids ?? []).join(","),
    (query.color_tag_slots ?? []).join(","),
    query.sort ?? "",
  ];
  return parts.join("|");
}

export function normalizeRecentQuery(query: GalleryRecentQuery): GalleryRecentQuery {
  return {
    ...(query.q?.trim() ? { q: query.q.trim() } : {}),
    ...(query.category_tag_ids?.length
      ? { category_tag_ids: [...query.category_tag_ids] }
      : {}),
    ...(query.storage_location_ids?.length
      ? { storage_location_ids: [...query.storage_location_ids] }
      : {}),
    ...(query.color_tag_slots?.length
      ? { color_tag_slots: [...query.color_tag_slots] }
      : {}),
    ...(query.sort ? { sort: query.sort } : {}),
  };
}

export function isRecordableRecentQuery(query: GalleryRecentQuery): boolean {
  return hasActiveFilters(normalizeRecentQuery(query));
}

export function pushRecentGalleryQuery(
  entries: readonly GalleryRecentEntry[],
  query: GalleryRecentQuery,
  label: string,
  now = Date.now(),
): GalleryRecentEntry[] {
  if (!isRecordableRecentQuery(query)) return [...entries];
  const normalized = normalizeRecentQuery(query);
  const fingerprint = fingerprintGalleryQuery(normalized);
  const trimmedLabel = label.trim() || fingerprint;
  const next: GalleryRecentEntry = {
    fingerprint,
    query: normalized,
    label: trimmedLabel.slice(0, 80),
    saved_at: now,
  };
  const rest = entries.filter((e) => e.fingerprint !== fingerprint);
  return [next, ...rest].slice(0, GALLERY_RECENT_MAX);
}

export function sanitizeRecentEntries(raw: unknown): GalleryRecentEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: GalleryRecentEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const query =
      row.query && typeof row.query === "object"
        ? normalizeRecentQuery(row.query as GalleryRecentQuery)
        : null;
    if (!query || !isRecordableRecentQuery(query)) continue;
    const fingerprint =
      typeof row.fingerprint === "string" && row.fingerprint
        ? row.fingerprint
        : fingerprintGalleryQuery(query);
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    const label =
      typeof row.label === "string" && row.label.trim()
        ? row.label.trim().slice(0, 80)
        : fingerprint;
    const saved_at =
      typeof row.saved_at === "number" && Number.isFinite(row.saved_at)
        ? row.saved_at
        : 0;
    out.push({ fingerprint, query, label, saved_at });
    if (out.length >= GALLERY_RECENT_MAX) break;
  }
  return out;
}

export function readRecentGalleryQueries(): GalleryRecentEntry[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(GALLERY_RECENT_QUERIES_KEY);
    if (!raw) return [];
    return sanitizeRecentEntries(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function writeRecentGalleryQueries(
  entries: readonly GalleryRecentEntry[],
): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      GALLERY_RECENT_QUERIES_KEY,
      JSON.stringify(sanitizeRecentEntries(entries)),
    );
  } catch {
    /* ignore */
  }
}

export function rememberRecentGalleryQuery(
  query: GalleryRecentQuery,
  label: string,
): GalleryRecentEntry[] {
  const next = pushRecentGalleryQuery(
    readRecentGalleryQueries(),
    query,
    label,
  );
  writeRecentGalleryQueries(next);
  return next;
}

export function clearRecentGalleryQueries(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(GALLERY_RECENT_QUERIES_KEY);
  } catch {
    /* ignore */
  }
}
