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
  product_color_codes?: string[];
  sales_desired?: boolean;
  want_object?: boolean;
  missing_price?: boolean;
  missing_purchase_date?: boolean;
  purchase_month?: string;
  missing_category?: boolean;
  missing_storage?: boolean;
  missing_photo?: boolean;
  duplicate_barcode?: boolean;
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
  if ((query.product_color_codes?.length ?? 0) > 0) return true;
  if (query.sales_desired) return true;
  if (query.want_object) return true;
  if (query.missing_price) return true;
  if (query.missing_purchase_date) return true;
  if (query.purchase_month) return true;
  if (query.missing_category) return true;
  if (query.missing_storage) return true;
  if (query.missing_photo) return true;
  if (query.duplicate_barcode) return true;
  return false;
}

/** offset を除いた指紋（並びは含める）。 */
export function fingerprintGalleryQuery(query: GalleryRecentQuery): string {
  const parts = [
    query.q?.trim() ?? "",
    (query.category_tag_ids ?? []).join(","),
    (query.storage_location_ids ?? []).join(","),
    (query.color_tag_slots ?? []).join(","),
    (query.product_color_codes ?? []).join(","),
    query.sort ?? "",
    query.sales_desired ? "1" : "",
    query.want_object ? "1" : "",
    query.missing_price ? "1" : "",
    query.missing_purchase_date ? "1" : "",
    query.purchase_month ?? "",
    query.missing_category ? "1" : "",
    query.missing_storage ? "1" : "",
    query.missing_photo ? "1" : "",
    query.duplicate_barcode ? "1" : "",
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
    ...(query.product_color_codes?.length
      ? { product_color_codes: [...query.product_color_codes] }
      : {}),
    ...(query.sales_desired ? { sales_desired: true } : {}),
    ...(query.want_object ? { want_object: true } : {}),
    ...(query.missing_price ? { missing_price: true } : {}),
    ...(query.missing_purchase_date ? { missing_purchase_date: true } : {}),
    ...(query.purchase_month ? { purchase_month: query.purchase_month } : {}),
    ...(query.missing_category ? { missing_category: true } : {}),
    ...(query.missing_storage ? { missing_storage: true } : {}),
    ...(query.missing_photo ? { missing_photo: true } : {}),
    ...(query.duplicate_barcode ? { duplicate_barcode: true } : {}),
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
