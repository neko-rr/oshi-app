/** ギャラリー一覧の URL クエリ（snake_case）。複数 ID はカンマ区切り。 */

import type { ListSortId } from "./displayPrefs";
import { sanitizeListSort } from "./displayPrefs";

/**
 * ギャラリー URL クエリの版。
 * v=1: 同種 OR・異種 AND・カンマ区切り ID。未リリースのため当面この版のみ。
 * API（GET /products）には送らない（Web の共有／ブックマーク用）。
 */
export const GALLERY_QUERY_VERSION = 1 as const;

export type GalleryListQuery = {
  q?: string;
  category_tag_ids?: number[];
  storage_location_ids?: number[];
  color_tag_slots?: number[];
  /** true のとき交換OKだけ */
  sales_desired?: boolean;
  /** true のとき欲しいだけ */
  want_object?: boolean;
  /** true のとき購入価格が空だけ */
  missing_price?: boolean;
  /** true のとき購入日が空だけ */
  missing_purchase_date?: boolean;
  /** YYYY-MM。その月の購入日だけ */
  purchase_month?: string;
  /** true のときカテゴリが空だけ */
  missing_category?: boolean;
  /** true のとき収納場所が空だけ */
  missing_storage?: boolean;
  /** true のとき写真が無いだけ */
  missing_photo?: boolean;
  /** true のとき同じバーコードが2件以上の品だけ */
  duplicate_barcode?: boolean;
  offset?: number;
  sort?: ListSortId;
};

const MAX_SLOT = 7;

/** 欠落・不正は現行版として扱う（未リリース前提で v 上昇はしない）。 */
export function parseGalleryQueryVersion(
  raw: string | undefined,
): typeof GALLERY_QUERY_VERSION {
  if (raw == null || raw.trim() === "") return GALLERY_QUERY_VERSION;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || Math.floor(n) !== GALLERY_QUERY_VERSION) {
    return GALLERY_QUERY_VERSION;
  }
  return GALLERY_QUERY_VERSION;
}

/** カンマ区切り / 単一の正の整数リスト。重複除去・順序維持。 */
export function parseIdList(raw: string | undefined): number[] | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const out: number[] = [];
  const seen = new Set<number>();
  for (const part of raw.split(",")) {
    const n = Number(part.trim());
    if (!Number.isFinite(n) || n < 1) continue;
    const id = Math.floor(n);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.length > 0 ? out : undefined;
}

/** カラースロット 1..7 */
export function parseColorSlotList(raw: string | undefined): number[] | undefined {
  const ids = parseIdList(raw);
  if (!ids) return undefined;
  const out = ids.filter((s) => s >= 1 && s <= MAX_SLOT);
  return out.length > 0 ? out : undefined;
}

export function formatIdList(ids: number[] | undefined): string | undefined {
  if (!ids || ids.length === 0) return undefined;
  return ids.join(",");
}

/** YYYY-MM だけ。それ以外は絞らない。 */
export function parsePurchaseMonth(raw: string | undefined): string | undefined {
  const text = (raw ?? "").trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) return undefined;
  return text;
}

function ledgerQuery(query: GalleryListQuery): GalleryListQuery {
  return {
    ...(query.missing_price ? { missing_price: true } : {}),
    ...(query.missing_purchase_date ? { missing_purchase_date: true } : {}),
    ...(query.purchase_month ? { purchase_month: query.purchase_month } : {}),
    ...(query.missing_category ? { missing_category: true } : {}),
    ...(query.missing_storage ? { missing_storage: true } : {}),
    ...(query.missing_photo ? { missing_photo: true } : {}),
    ...(query.duplicate_barcode ? { duplicate_barcode: true } : {}),
  };
}

/** URL の 1 / true だけ ON。省略と 0 は絞らない。 */
function parseOnFlag(raw: string | undefined): boolean {
  const value = (raw ?? "").trim().toLowerCase();
  return value === "1" || value === "true";
}

export function parseGalleryListQuery(params: {
  q?: string;
  category_tag_id?: string;
  storage_location_id?: string;
  color_tag_slot?: string;
  sales_desired?: string;
  want_object?: string;
  missing_price?: string;
  missing_purchase_date?: string;
  purchase_month?: string;
  missing_category?: string;
  missing_storage?: string;
  missing_photo?: string;
  duplicate_barcode?: string;
  offset?: string;
  sort?: string;
  v?: string;
}): GalleryListQuery {
  // 将来の分岐用に読む。現状は常に v1 意味で解釈する。
  parseGalleryQueryVersion(params.v);
  const q = (params.q ?? "").trim();
  const category_tag_ids = parseIdList(params.category_tag_id);
  const storage_location_ids = parseIdList(params.storage_location_id);
  const color_tag_slots = parseColorSlotList(params.color_tag_slot);
  const sales_desired = parseOnFlag(params.sales_desired);
  const want_object = parseOnFlag(params.want_object);
  const missing_price = parseOnFlag(params.missing_price);
  const missing_purchase_date = parseOnFlag(params.missing_purchase_date);
  const purchase_month = parsePurchaseMonth(params.purchase_month);
  const missing_category = parseOnFlag(params.missing_category);
  const missing_storage = parseOnFlag(params.missing_storage);
  const missing_photo = parseOnFlag(params.missing_photo);
  const duplicate_barcode = parseOnFlag(params.duplicate_barcode);
  const offset = parseNonNegativeInt(params.offset) ?? 0;
  const sort = params.sort ? sanitizeListSort(params.sort) : undefined;
  return {
    ...(q ? { q } : {}),
    ...(category_tag_ids ? { category_tag_ids } : {}),
    ...(storage_location_ids ? { storage_location_ids } : {}),
    ...(color_tag_slots ? { color_tag_slots } : {}),
    ...(sales_desired ? { sales_desired: true } : {}),
    ...(want_object ? { want_object: true } : {}),
    ...(missing_price ? { missing_price: true } : {}),
    ...(missing_purchase_date ? { missing_purchase_date: true } : {}),
    ...(purchase_month ? { purchase_month } : {}),
    ...(missing_category ? { missing_category: true } : {}),
    ...(missing_storage ? { missing_storage: true } : {}),
    ...(missing_photo ? { missing_photo: true } : {}),
    ...(duplicate_barcode ? { duplicate_barcode: true } : {}),
    ...(offset > 0 ? { offset } : {}),
    ...(sort ? { sort } : {}),
  };
}

function parseNonNegativeInt(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

function toggleId(ids: number[] | undefined, id: number): number[] | undefined {
  const set = new Set(ids ?? []);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const next = [...set].sort((a, b) => a - b);
  return next.length > 0 ? next : undefined;
}

/** offset を落とし、交換OK・欲しいを含めて他の条件を残す。 */
function withoutOffset(query: GalleryListQuery): GalleryListQuery {
  return {
    ...(query.q ? { q: query.q } : {}),
    ...(query.category_tag_ids ? { category_tag_ids: query.category_tag_ids } : {}),
    ...(query.storage_location_ids
      ? { storage_location_ids: query.storage_location_ids }
      : {}),
    ...(query.color_tag_slots ? { color_tag_slots: query.color_tag_slots } : {}),
    ...(query.sales_desired ? { sales_desired: true } : {}),
    ...(query.want_object ? { want_object: true } : {}),
    ...ledgerQuery(query),
    ...(query.sort ? { sort: query.sort } : {}),
  };
}

/** チップトグル用: 他次元と q/sort を保持した次クエリ */
export function withToggledCategory(
  query: GalleryListQuery,
  id: number,
): GalleryListQuery {
  const next = withoutOffset(query);
  const ids = toggleId(query.category_tag_ids, id);
  if (ids) next.category_tag_ids = ids;
  else delete next.category_tag_ids;
  return next;
}

export function withToggledSalesDesired(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  if (query.sales_desired) delete next.sales_desired;
  else next.sales_desired = true;
  return next;
}

export function withToggledWantObject(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  if (query.want_object) delete next.want_object;
  else next.want_object = true;
  return next;
}

export function withToggledMissingPrice(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  if (query.missing_price) delete next.missing_price;
  else next.missing_price = true;
  return next;
}

export function withToggledMissingPurchaseDate(
  query: GalleryListQuery,
): GalleryListQuery {
  const next = withoutOffset(query);
  if (query.missing_purchase_date) delete next.missing_purchase_date;
  else next.missing_purchase_date = true;
  return next;
}

export function withToggledMissingCategory(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  if (query.missing_category) delete next.missing_category;
  else next.missing_category = true;
  return next;
}

export function withToggledMissingStorage(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  if (query.missing_storage) delete next.missing_storage;
  else next.missing_storage = true;
  return next;
}

export function withToggledMissingPhoto(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  if (query.missing_photo) delete next.missing_photo;
  else next.missing_photo = true;
  return next;
}

export function withToggledDuplicateBarcode(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  if (query.duplicate_barcode) delete next.duplicate_barcode;
  else next.duplicate_barcode = true;
  return next;
}

export function withClearedPurchaseMonth(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  delete next.purchase_month;
  return next;
}

export function withToggledStorage(
  query: GalleryListQuery,
  id: number,
): GalleryListQuery {
  const next = withoutOffset(query);
  const ids = toggleId(query.storage_location_ids, id);
  if (ids) next.storage_location_ids = ids;
  else delete next.storage_location_ids;
  return next;
}

export function withToggledColorSlot(
  query: GalleryListQuery,
  slot: number,
): GalleryListQuery {
  const next = withoutOffset(query);
  const ids = toggleId(query.color_tag_slots, slot);
  if (ids) next.color_tag_slots = ids;
  else delete next.color_tag_slots;
  return next;
}

export function withClearedCategory(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  delete next.category_tag_ids;
  return next;
}

export function withClearedStorage(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  delete next.storage_location_ids;
  return next;
}

export function withClearedColor(query: GalleryListQuery): GalleryListQuery {
  const next = withoutOffset(query);
  delete next.color_tag_slots;
  return next;
}

/** いまの絞り込み件数（異種 AND の要約用）。並びは含めない。 */
export type GalleryFilterSummaryCounts = {
  q: boolean;
  category: number;
  storage: number;
  color: number;
  sales_desired: boolean;
  want_object: boolean;
  missing_price: boolean;
  missing_purchase_date: boolean;
  purchase_month: boolean;
  missing_category: boolean;
  missing_storage: boolean;
  missing_photo: boolean;
  duplicate_barcode: boolean;
};

export function galleryFilterSummaryCounts(
  query: GalleryListQuery,
): GalleryFilterSummaryCounts {
  return {
    q: Boolean(query.q?.trim()),
    category: query.category_tag_ids?.length ?? 0,
    storage: query.storage_location_ids?.length ?? 0,
    color: query.color_tag_slots?.length ?? 0,
    sales_desired: Boolean(query.sales_desired),
    want_object: Boolean(query.want_object),
    missing_price: Boolean(query.missing_price),
    missing_purchase_date: Boolean(query.missing_purchase_date),
    purchase_month: Boolean(query.purchase_month),
    missing_category: Boolean(query.missing_category),
    missing_storage: Boolean(query.missing_storage),
    missing_photo: Boolean(query.missing_photo),
    duplicate_barcode: Boolean(query.duplicate_barcode),
  };
}

export function hasActiveGalleryFilters(query: GalleryListQuery): boolean {
  const c = galleryFilterSummaryCounts(query);
  return (
    c.q ||
    c.category > 0 ||
    c.storage > 0 ||
    c.color > 0 ||
    c.sales_desired ||
    c.want_object ||
    c.missing_price ||
    c.missing_purchase_date ||
    c.purchase_month ||
    c.missing_category ||
    c.missing_storage ||
    c.missing_photo ||
    c.duplicate_barcode
  );
}

/** 検索・タグ絞り込みを全解除。並びだけ残す。 */
export function withClearedFilters(query: GalleryListQuery): GalleryListQuery {
  return {
    ...(query.sort ? { sort: query.sort } : {}),
  };
}

export function withSort(
  query: GalleryListQuery,
  sort: ListSortId,
): GalleryListQuery {
  return {
    ...withoutOffset(query),
    sort,
  };
}

/**
 * `/gallery` 用のクエリ文字列（先頭 ? なし）。空なら ""。
 * 何かパラメータがあるときは先頭に `v=1` を付ける（API には付けない）。
 */
export function buildGalleryListSearch(query: GalleryListQuery): string {
  const sp = new URLSearchParams();
  if (query.q?.trim()) sp.set("q", query.q.trim());
  const cats = formatIdList(query.category_tag_ids);
  if (cats) sp.set("category_tag_id", cats);
  const storages = formatIdList(query.storage_location_ids);
  if (storages) sp.set("storage_location_id", storages);
  const colors = formatIdList(query.color_tag_slots);
  if (colors) sp.set("color_tag_slot", colors);
  if (query.sales_desired) sp.set("sales_desired", "1");
  if (query.want_object) sp.set("want_object", "1");
  if (query.missing_price) sp.set("missing_price", "1");
  if (query.missing_purchase_date) sp.set("missing_purchase_date", "1");
  if (query.purchase_month) sp.set("purchase_month", query.purchase_month);
  if (query.missing_category) sp.set("missing_category", "1");
  if (query.missing_storage) sp.set("missing_storage", "1");
  if (query.missing_photo) sp.set("missing_photo", "1");
  if (query.duplicate_barcode) sp.set("duplicate_barcode", "1");
  if (query.offset != null && query.offset > 0) {
    sp.set("offset", String(query.offset));
  }
  if (query.sort) {
    sp.set("sort", query.sort);
  }
  if ([...sp.keys()].length === 0) return "";
  const out = new URLSearchParams();
  out.set("v", String(GALLERY_QUERY_VERSION));
  for (const [key, value] of sp.entries()) {
    out.set(key, value);
  }
  return out.toString();
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
  const s = buildGalleryListSearch(listQuery);
  const base = `/gallery/${registeredProductId}`;
  return s ? `${base}?${s}` : base;
}

/** GET /products のパス＋クエリ */
export function productsApiPath(
  query: GalleryListQuery & { limit?: number; view?: "edit" },
): string {
  const sp = new URLSearchParams();
  if (query.view === "edit") sp.set("view", "edit");
  if (query.limit != null) sp.set("limit", String(query.limit));
  if (query.offset != null && query.offset > 0) {
    sp.set("offset", String(query.offset));
  }
  if (query.q?.trim()) sp.set("q", query.q.trim());
  const cats = formatIdList(query.category_tag_ids);
  if (cats) sp.set("category_tag_id", cats);
  const storages = formatIdList(query.storage_location_ids);
  if (storages) sp.set("storage_location_id", storages);
  const colors = formatIdList(query.color_tag_slots);
  if (colors) sp.set("color_tag_slot", colors);
  if (query.sales_desired) sp.set("sales_desired", "1");
  if (query.want_object) sp.set("want_object", "1");
  if (query.missing_price) sp.set("missing_price", "1");
  if (query.missing_purchase_date) sp.set("missing_purchase_date", "1");
  if (query.purchase_month) sp.set("purchase_month", query.purchase_month);
  if (query.missing_category) sp.set("missing_category", "1");
  if (query.missing_storage) sp.set("missing_storage", "1");
  if (query.missing_photo) sp.set("missing_photo", "1");
  if (query.duplicate_barcode) sp.set("duplicate_barcode", "1");
  if (query.sort) {
    sp.set("sort", query.sort);
  }
  const s = sp.toString();
  return s ? `/products?${s}` : "/products";
}
