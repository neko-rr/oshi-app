/**
 * registerPrefs の自己検査。
 * 実行: node --experimental-strip-types apps/web/src/lib/registerPrefs.selftest.ts
 */
import assert from "node:assert/strict";
import { orderStorageLocationsForRegister } from "./registerPrefs.ts";
import {
  DEFAULT_REGISTER_START_STEP,
  sanitizeDefaultStorageLocationId,
  sanitizeRegisterStartStep,
} from "./displayPrefs.ts";

assert.equal(sanitizeRegisterStartStep("photo"), "photo");
assert.equal(sanitizeRegisterStartStep("nope"), DEFAULT_REGISTER_START_STEP);
assert.equal(sanitizeDefaultStorageLocationId(3), 3);
assert.equal(sanitizeDefaultStorageLocationId(0), null);
assert.equal(sanitizeDefaultStorageLocationId(""), null);

const items = [
  {
    storage_location_id: 1,
    display_order: 1,
    register_pick_count: 1,
    last_register_picked_at: "2026-01-01T00:00:00.000Z",
  },
  {
    storage_location_id: 2,
    display_order: 2,
    register_pick_count: 5,
    last_register_picked_at: "2026-02-01T00:00:00.000Z",
  },
  {
    storage_location_id: 3,
    display_order: 3,
    register_pick_count: 9,
    last_register_picked_at: "2026-01-15T00:00:00.000Z",
  },
];

// 指定なし: 最終使用 → 回数 → display_order
assert.deepEqual(
  orderStorageLocationsForRegister(items, null).map((x) => x.storage_location_id),
  [2, 3, 1],
);

// 指定あり: 先頭固定、残りは display_order
assert.deepEqual(
  orderStorageLocationsForRegister(items, 3).map((x) => x.storage_location_id),
  [3, 1, 2],
);

// 回数タイブレーク
const tied = [
  {
    storage_location_id: 10,
    display_order: 2,
    register_pick_count: 3,
    last_register_picked_at: null,
  },
  {
    storage_location_id: 11,
    display_order: 1,
    register_pick_count: 3,
    last_register_picked_at: null,
  },
];
assert.deepEqual(
  orderStorageLocationsForRegister(tied, null).map((x) => x.storage_location_id),
  [11, 10],
);

console.log("registerPrefs.selftest: ok");
