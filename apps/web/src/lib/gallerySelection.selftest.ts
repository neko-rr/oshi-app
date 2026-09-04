/**
 * gallerySelection の自己検査。
 * 実行: node --experimental-strip-types apps/web/src/lib/gallerySelection.selftest.ts
 */
import assert from "node:assert/strict";
import {
  GALLERY_BULK_MAX,
  filterItemsBySelection,
  isPageFullySelected,
  selectionFromIds,
  withPageSelected,
} from "./gallerySelection.ts";

assert.equal(GALLERY_BULK_MAX, 100);

const page = [1, 2, 3];
assert.equal(isPageFullySelected(new Set([1, 2]), page), false);
assert.equal(isPageFullySelected(new Set([1, 2, 3]), page), true);
assert.deepEqual([...withPageSelected(new Set([9]), page)].sort(), [1, 2, 3, 9]);

const many = Array.from({ length: 120 }, (_, i) => i + 1);
const capped = selectionFromIds(many);
assert.equal(capped.selectedIds.size, 100);
assert.equal(capped.truncated, true);
assert.equal(selectionFromIds([1, 2, 2, 0, -1]).selectedIds.size, 2);
assert.equal(selectionFromIds([1, 2]).truncated, false);

const items = [
  { registered_product_id: 1 },
  { registered_product_id: 2 },
  { registered_product_id: 3 },
];
assert.deepEqual(
  filterItemsBySelection(items, new Set([2, 3]), true).map(
    (x) => x.registered_product_id,
  ),
  [2, 3],
);
assert.equal(filterItemsBySelection(items, new Set([2]), false).length, 3);

console.log("gallerySelection.selftest: ok");
