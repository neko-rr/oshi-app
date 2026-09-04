/**
 * galleryListQuery の自己検査（displayPrefs 依存を避けるため契約を再実装検証）。
 * 実行: node --experimental-strip-types apps/web/src/lib/galleryListQuery.selftest.ts
 */
import assert from "node:assert/strict";

type GalleryListQuery = {
  q?: string;
  category_tag_ids?: number[];
  storage_location_ids?: number[];
  color_tag_slots?: number[];
  offset?: number;
  sort?: string;
};

/** galleryListQuery.parseIdList と同契約 */
function parseIdList(raw: string | undefined): number[] | undefined {
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

function parseColorSlotList(raw: string | undefined): number[] | undefined {
  const ids = parseIdList(raw);
  if (!ids) return undefined;
  const out = ids.filter((s) => s >= 1 && s <= 7);
  return out.length > 0 ? out : undefined;
}

function formatIdList(ids: number[] | undefined): string | undefined {
  if (!ids || ids.length === 0) return undefined;
  return ids.join(",");
}

/** galleryListQuery.galleryFilterSummaryCounts と同契約 */
function galleryFilterSummaryCounts(query: GalleryListQuery) {
  return {
    q: Boolean(query.q?.trim()),
    category: query.category_tag_ids?.length ?? 0,
    storage: query.storage_location_ids?.length ?? 0,
    color: query.color_tag_slots?.length ?? 0,
  };
}

function hasActiveGalleryFilters(query: GalleryListQuery): boolean {
  const c = galleryFilterSummaryCounts(query);
  return c.q || c.category > 0 || c.storage > 0 || c.color > 0;
}

/** galleryListQuery.withClearedFilters と同契約 */
function withClearedFilters(query: GalleryListQuery): GalleryListQuery {
  return {
    ...(query.sort ? { sort: query.sort } : {}),
  };
}

assert.deepEqual(parseIdList("3"), [3]);
assert.deepEqual(parseIdList("1,2,2,3"), [1, 2, 3]);
assert.equal(parseIdList(""), undefined);
assert.equal(parseIdList("0,-1,x"), undefined);
assert.deepEqual(parseColorSlotList("1,8,3"), [1, 3]);
assert.equal(formatIdList([1, 2]), "1,2");

assert.deepEqual(
  galleryFilterSummaryCounts({
    q: " 缶 ",
    category_tag_ids: [1, 2],
    storage_location_ids: [9],
    color_tag_slots: [1, 3],
    sort: "name",
  }),
  { q: true, category: 2, storage: 1, color: 2 },
);
assert.equal(hasActiveGalleryFilters({ category_tag_ids: [1] }), true);
assert.equal(hasActiveGalleryFilters({ sort: "newest" }), false);
assert.deepEqual(
  withClearedFilters({
    q: "x",
    category_tag_ids: [1],
    storage_location_ids: [2],
    color_tag_slots: [3],
    sort: "name",
    offset: 48,
  }),
  { sort: "name" },
);
assert.deepEqual(withClearedFilters({}), {});

const GALLERY_QUERY_VERSION = 1;

/** buildGalleryListSearch と同契約（版キー）。 */
function buildGalleryListSearch(query: GalleryListQuery): string {
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
  if (query.sort) sp.set("sort", query.sort);
  if ([...sp.keys()].length === 0) return "";
  const out = new URLSearchParams();
  out.set("v", String(GALLERY_QUERY_VERSION));
  for (const [key, value] of sp.entries()) {
    out.set(key, value);
  }
  return out.toString();
}

function parseGalleryQueryVersion(raw: string | undefined): number {
  if (raw == null || raw.trim() === "") return GALLERY_QUERY_VERSION;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || Math.floor(n) !== GALLERY_QUERY_VERSION) {
    return GALLERY_QUERY_VERSION;
  }
  return GALLERY_QUERY_VERSION;
}

assert.equal(buildGalleryListSearch({}), "");
assert.equal(buildGalleryListSearch({ sort: "name" }), "v=1&sort=name");
assert.ok(
  buildGalleryListSearch({ category_tag_ids: [1, 2] }).startsWith("v=1&"),
);
assert.equal(parseGalleryQueryVersion(undefined), 1);
assert.equal(parseGalleryQueryVersion("1"), 1);
assert.equal(parseGalleryQueryVersion("9"), 1);

console.log("galleryListQuery.selftest: ok");
