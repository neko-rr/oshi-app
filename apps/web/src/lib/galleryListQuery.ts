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

export function parseGalleryListQuery(params: {
  q?: string;
  category_tag_id?: string;
  storage_location_id?: string;
  color_tag_slot?: string;
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
  const offset = parseNonNegativeInt(params.offset) ?? 0;
  const sort = params.sort ? sanitizeListSort(params.sort) : undefined;
  return {
    ...(q ? { q } : {}),
    ...(category_tag_ids ? { category_tag_ids } : {}),
    ...(storage_location_ids ? { storage_location_ids } : {}),
    ...(color_tag_slots ? { color_tag_slots } : {}),
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

/** チップトグル用: 他次元と q/sort を保持した次クエリ */
export function withToggledCategory(
  query: GalleryListQuery,
  id: number,
): GalleryListQuery {
  return {
    q: query.q,
    category_tag_ids: toggleId(query.category_tag_ids, id),
    storage_location_ids: query.storage_location_ids,
    color_tag_slots: query.color_tag_slots,
    sort: query.sort,
  };
}

export function withToggledStorage(
  query: GalleryListQuery,
  id: number,
): GalleryListQuery {
  return {
    q: query.q,
    category_tag_ids: query.category_tag_ids,
    storage_location_ids: toggleId(query.storage_location_ids, id),
    color_tag_slots: query.color_tag_slots,
    sort: query.sort,
  };
}

export function withToggledColorSlot(
  query: GalleryListQuery,
  slot: number,
): GalleryListQuery {
  return {
    q: query.q,
    category_tag_ids: query.category_tag_ids,
    storage_location_ids: query.storage_location_ids,
    color_tag_slots: toggleId(query.color_tag_slots, slot),
    sort: query.sort,
  };
}

export function withClearedCategory(query: GalleryListQuery): GalleryListQuery {
  return {
    q: query.q,
    storage_location_ids: query.storage_location_ids,
    color_tag_slots: query.color_tag_slots,
    sort: query.sort,
  };
}

export function withClearedStorage(query: GalleryListQuery): GalleryListQuery {
  return {
    q: query.q,
    category_tag_ids: query.category_tag_ids,
    color_tag_slots: query.color_tag_slots,
    sort: query.sort,
  };
}

export function withClearedColor(query: GalleryListQuery): GalleryListQuery {
  return {
    q: query.q,
    category_tag_ids: query.category_tag_ids,
    storage_location_ids: query.storage_location_ids,
    sort: query.sort,
  };
}

/** いまの絞り込み件数（異種 AND の要約用）。並びは含めない。 */
export type GalleryFilterSummaryCounts = {
  q: boolean;
  category: number;
  storage: number;
  color: number;
};

export function galleryFilterSummaryCounts(
  query: GalleryListQuery,
): GalleryFilterSummaryCounts {
  return {
    q: Boolean(query.q?.trim()),
    category: query.category_tag_ids?.length ?? 0,
    storage: query.storage_location_ids?.length ?? 0,
    color: query.color_tag_slots?.length ?? 0,
  };
}

export function hasActiveGalleryFilters(query: GalleryListQuery): boolean {
  const c = galleryFilterSummaryCounts(query);
  return c.q || c.category > 0 || c.storage > 0 || c.color > 0;
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
    q: query.q,
    category_tag_ids: query.category_tag_ids,
    storage_location_ids: query.storage_location_ids,
    color_tag_slots: query.color_tag_slots,
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
  const s = buildGalleryListSearch({
    q: listQuery.q,
    category_tag_ids: listQuery.category_tag_ids,
    storage_location_ids: listQuery.storage_location_ids,
    color_tag_slots: listQuery.color_tag_slots,
    sort: listQuery.sort,
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
  const cats = formatIdList(query.category_tag_ids);
  if (cats) sp.set("category_tag_id", cats);
  const storages = formatIdList(query.storage_location_ids);
  if (storages) sp.set("storage_location_id", storages);
  const colors = formatIdList(query.color_tag_slots);
  if (colors) sp.set("color_tag_slot", colors);
  if (query.sort) {
    sp.set("sort", query.sort);
  }
  const s = sp.toString();
  return s ? `/products?${s}` : "/products";
}
