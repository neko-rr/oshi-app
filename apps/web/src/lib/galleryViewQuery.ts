/** gallery_view ↔ GalleryListQuery 変換（offset は適用時に落とす）。 */

import {
  parseProductColorList,
  type GalleryListQuery,
} from "./galleryListQuery";
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
  product_color_codes?: string[];
  sales_desired?: boolean;
  want_object?: boolean;
  missing_price?: boolean;
  missing_purchase_date?: boolean;
  purchase_month?: string | null;
  missing_category?: boolean;
  missing_storage?: boolean;
  missing_photo?: boolean;
  duplicate_barcode?: boolean;
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
  const product_color_codes =
    parseProductColorList((view.product_color_codes ?? []).join(",")) ?? [];
  const sort = sanitizeListSort(view.list_sort) as ListSortId;
  return {
    ...(q ? { q } : {}),
    ...(category_tag_ids.length > 0 ? { category_tag_ids } : {}),
    ...(storage_location_ids.length > 0 ? { storage_location_ids } : {}),
    ...(color_tag_slots.length > 0 ? { color_tag_slots } : {}),
    ...(product_color_codes.length > 0 ? { product_color_codes } : {}),
    ...(view.sales_desired ? { sales_desired: true } : {}),
    ...(view.want_object ? { want_object: true } : {}),
    ...(view.missing_price ? { missing_price: true } : {}),
    ...(view.missing_purchase_date ? { missing_purchase_date: true } : {}),
    ...(view.purchase_month ? { purchase_month: view.purchase_month } : {}),
    ...(view.missing_category ? { missing_category: true } : {}),
    ...(view.missing_storage ? { missing_storage: true } : {}),
    ...(view.missing_photo ? { missing_photo: true } : {}),
    ...(view.duplicate_barcode ? { duplicate_barcode: true } : {}),
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
  product_color_codes: string[];
  sales_desired: boolean;
  want_object: boolean;
  missing_price: boolean;
  missing_purchase_date: boolean;
  purchase_month: string | null;
  missing_category: boolean;
  missing_storage: boolean;
  missing_photo: boolean;
  duplicate_barcode: boolean;
  list_sort: ListSortId;
} {
  const name = viewName.trim();
  return {
    view_name: name,
    q: query.q?.trim() ? query.q.trim() : null,
    category_tag_ids: [...(query.category_tag_ids ?? [])],
    storage_location_ids: [...(query.storage_location_ids ?? [])],
    color_tag_slots: [...(query.color_tag_slots ?? [])],
    product_color_codes: [...(query.product_color_codes ?? [])],
    sales_desired: Boolean(query.sales_desired),
    want_object: Boolean(query.want_object),
    missing_price: Boolean(query.missing_price),
    missing_purchase_date: Boolean(query.missing_purchase_date),
    purchase_month: query.purchase_month ?? null,
    missing_category: Boolean(query.missing_category),
    missing_storage: Boolean(query.missing_storage),
    missing_photo: Boolean(query.missing_photo),
    duplicate_barcode: Boolean(query.duplicate_barcode),
    list_sort: query.sort ?? fallbackSort,
  };
}
