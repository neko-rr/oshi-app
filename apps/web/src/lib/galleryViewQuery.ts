/** gallery_view ↔ GalleryListQuery 変換（offset は適用時に落とす）。 */

import type { GalleryListQuery } from "./galleryListQuery";
import { sanitizeListSort, type ListSortId } from "./displayPrefs";

export const GALLERY_VIEW_MAX = 20;
export const GALLERY_VIEW_NAME_MAX = 40;

export type GalleryViewItem = {
  gallery_view_id: number;
  view_name: string;
  q?: string | null;
  category_tag_ids?: number[];
  storage_location_ids?: number[];
  color_tag_slots?: number[];
  list_sort: string;
  display_order?: number;
};

export type GalleryViewListResponse = {
  items: GalleryViewItem[];
};

/** 保存ビュー → 一覧 URL クエリ（offset なし）。 */
export function galleryListQueryFromView(view: GalleryViewItem): GalleryListQuery {
  const q = (view.q ?? "").trim();
  const category_tag_ids = (view.category_tag_ids ?? []).filter((n) => n >= 1);
  const storage_location_ids = (view.storage_location_ids ?? []).filter(
    (n) => n >= 1,
  );
  const color_tag_slots = (view.color_tag_slots ?? []).filter(
    (n) => n >= 1 && n <= 7,
  );
  const sort = sanitizeListSort(view.list_sort) as ListSortId;
  return {
    ...(q ? { q } : {}),
    ...(category_tag_ids.length > 0 ? { category_tag_ids } : {}),
    ...(storage_location_ids.length > 0 ? { storage_location_ids } : {}),
    ...(color_tag_slots.length > 0 ? { color_tag_slots } : {}),
    sort,
  };
}

/** いまの一覧クエリ → 作成ボディ用。 */
export function galleryViewPayloadFromQuery(
  query: GalleryListQuery,
  viewName: string,
  fallbackSort: ListSortId = "newest",
): {
  view_name: string;
  q: string | null;
  category_tag_ids: number[];
  storage_location_ids: number[];
  color_tag_slots: number[];
  list_sort: ListSortId;
} {
  const name = viewName.trim();
  return {
    view_name: name,
    q: query.q?.trim() ? query.q.trim() : null,
    category_tag_ids: [...(query.category_tag_ids ?? [])],
    storage_location_ids: [...(query.storage_location_ids ?? [])],
    color_tag_slots: [...(query.color_tag_slots ?? [])],
    list_sort: query.sort ?? fallbackSort,
  };
}
