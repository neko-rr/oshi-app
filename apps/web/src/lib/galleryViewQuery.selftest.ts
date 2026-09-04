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
  sort?: string;
};

type GalleryViewItem = {
  gallery_view_id: number;
  view_name: string;
  q?: string | null;
  category_tag_ids?: number[];
  storage_location_ids?: number[];
  color_tag_slots?: number[];
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
    list_sort: "created_at",
  },
);

console.log("galleryViewQuery.selftest: ok");
