/**
 * galleryViewQuery の自己検査。
 * 実行: node --experimental-strip-types apps/web/src/lib/galleryViewQuery.selftest.ts
 */
import assert from "node:assert/strict";

type GalleryListQuery = {
  q?: string;
  category_tag_ids?: number[];
  storage_location_ids?: number[];
  color_tag_slots?: number[];
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

type GalleryViewItem = {
  gallery_view_id: number;
  view_name: string;
  q?: string | null;
  category_tag_ids?: number[];
  storage_location_ids?: number[];
  color_tag_slots?: number[];
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
};

function sanitizeListSort(raw: string | undefined): string {
  if (raw === "name" || raw === "created_at" || raw === "newest") return raw;
  return "newest";
}

function galleryListQueryFromView(view: GalleryViewItem): GalleryListQuery {
  const q = (view.q ?? "").trim();
  const category_tag_ids = (view.category_tag_ids ?? []).filter((n) => n >= 1);
  const storage_location_ids = (view.storage_location_ids ?? []).filter(
    (n) => n >= 1,
  );
  const color_tag_slots = (view.color_tag_slots ?? []).filter(
    (n) => n >= 1 && n <= 7,
  );
  return {
    ...(q ? { q } : {}),
    ...(category_tag_ids.length > 0 ? { category_tag_ids } : {}),
    ...(storage_location_ids.length > 0 ? { storage_location_ids } : {}),
    ...(color_tag_slots.length > 0 ? { color_tag_slots } : {}),
    ...(view.sales_desired ? { sales_desired: true } : {}),
    ...(view.want_object ? { want_object: true } : {}),
    ...(view.missing_price ? { missing_price: true } : {}),
    ...(view.missing_purchase_date ? { missing_purchase_date: true } : {}),
    ...(view.purchase_month ? { purchase_month: view.purchase_month } : {}),
    ...(view.missing_category ? { missing_category: true } : {}),
    ...(view.missing_storage ? { missing_storage: true } : {}),
    ...(view.missing_photo ? { missing_photo: true } : {}),
    ...(view.duplicate_barcode ? { duplicate_barcode: true } : {}),
    sort: sanitizeListSort(view.list_sort),
  };
}

function galleryViewPayloadFromQuery(
  query: GalleryListQuery,
  viewName: string,
): Record<string, unknown> {
  return {
    view_name: viewName.trim(),
    q: query.q?.trim() ? query.q.trim() : null,
    category_tag_ids: [...(query.category_tag_ids ?? [])],
    storage_location_ids: [...(query.storage_location_ids ?? [])],
    color_tag_slots: [...(query.color_tag_slots ?? [])],
    sales_desired: Boolean(query.sales_desired),
    want_object: Boolean(query.want_object),
    missing_price: Boolean(query.missing_price),
    missing_purchase_date: Boolean(query.missing_purchase_date),
    purchase_month: query.purchase_month ?? null,
    missing_category: Boolean(query.missing_category),
    missing_storage: Boolean(query.missing_storage),
    missing_photo: Boolean(query.missing_photo),
    duplicate_barcode: Boolean(query.duplicate_barcode),
    list_sort: query.sort ?? "newest",
  };
}

assert.deepEqual(
  galleryListQueryFromView({
    gallery_view_id: 1,
    view_name: "x",
    q: " 缶 ",
    category_tag_ids: [1, 2],
    storage_location_ids: [],
    color_tag_slots: [1, 9],
    list_sort: "name",
  }),
  {
    q: "缶",
    category_tag_ids: [1, 2],
    color_tag_slots: [1],
    sort: "name",
  },
);

assert.deepEqual(
  galleryViewPayloadFromQuery(
    { q: "a", category_tag_ids: [3], sort: "created_at" },
    " 棚A ",
  ),
  {
    view_name: "棚A",
    q: "a",
    category_tag_ids: [3],
    storage_location_ids: [],
    color_tag_slots: [],
    sales_desired: false,
    want_object: false,
    missing_price: false,
    missing_purchase_date: false,
    purchase_month: null,
    missing_category: false,
    missing_storage: false,
    missing_photo: false,
    duplicate_barcode: false,
    list_sort: "created_at",
  },
);

assert.equal(
  galleryListQueryFromView({
    gallery_view_id: 1,
    view_name: "x",
    list_sort: "newest",
    sales_desired: true,
    want_object: true,
  }).sales_desired,
  true,
);
assert.equal(
  galleryViewPayloadFromQuery(
    { sales_desired: true, want_object: true },
    "交換",
  ).want_object,
  true,
);
assert.equal(
  galleryListQueryFromView({
    gallery_view_id: 2,
    view_name: "穴",
    list_sort: "newest",
    missing_photo: true,
    duplicate_barcode: true,
  }).duplicate_barcode,
  true,
);

console.log("galleryViewQuery.selftest: ok");
