/** ギャラリー一覧の URL クエリ（snake_case）。 */

export type GalleryListQuery = {
  q?: string;
  category_tag_id?: number;
  storage_location_id?: number;
  offset?: number;
};

export function parseGalleryListQuery(params: {
  q?: string;
  category_tag_id?: string;
  storage_location_id?: string;
  offset?: string;
}): GalleryListQuery {
  const q = (params.q ?? "").trim();
  const category_tag_id = parsePositiveInt(params.category_tag_id);
  const storage_location_id = parsePositiveInt(params.storage_location_id);
  const offset = parseNonNegativeInt(params.offset) ?? 0;
  return {
    ...(q ? { q } : {}),
    ...(category_tag_id != null ? { category_tag_id } : {}),
    ...(storage_location_id != null ? { storage_location_id } : {}),
    ...(offset > 0 ? { offset } : {}),
  };
}

function parsePositiveInt(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

function parseNonNegativeInt(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

/** `/gallery` 用のクエリ文字列（先頭 ? なし）。空なら ""。 */
export function buildGalleryListSearch(query: GalleryListQuery): string {
  const sp = new URLSearchParams();
  if (query.q?.trim()) sp.set("q", query.q.trim());
  if (query.category_tag_id != null) {
    sp.set("category_tag_id", String(query.category_tag_id));
  }
  if (query.storage_location_id != null) {
    sp.set("storage_location_id", String(query.storage_location_id));
  }
  if (query.offset != null && query.offset > 0) {
    sp.set("offset", String(query.offset));
  }
  return sp.toString();
}

export function galleryListHref(query: GalleryListQuery = {}): string {
  const s = buildGalleryListSearch(query);
  return s ? `/gallery?${s}` : "/gallery";
}

/** 詳細へのリンクに一覧コンテキストを載せる */
export function galleryDetailHref(
  registeredProductId: number,
  listQuery: GalleryListQuery = {},
): string {
  const s = buildGalleryListSearch({
    q: listQuery.q,
    category_tag_id: listQuery.category_tag_id,
    storage_location_id: listQuery.storage_location_id,
    // 詳細の戻るでは offset も復元
    offset: listQuery.offset,
  });
  const base = `/gallery/${registeredProductId}`;
  return s ? `${base}?${s}` : base;
}

/** GET /products のパス＋クエリ */
export function productsApiPath(
  query: GalleryListQuery & { limit?: number },
): string {
  const sp = new URLSearchParams();
  if (query.limit != null) sp.set("limit", String(query.limit));
  if (query.offset != null && query.offset > 0) {
    sp.set("offset", String(query.offset));
  }
  if (query.q?.trim()) sp.set("q", query.q.trim());
  if (query.category_tag_id != null) {
    sp.set("category_tag_id", String(query.category_tag_id));
  }
  if (query.storage_location_id != null) {
    sp.set("storage_location_id", String(query.storage_location_id));
  }
  const s = sp.toString();
  // API_PATHS.products と揃える（循環を避けるため文字列定数）
  return s ? `/products?${s}` : "/products";
}
