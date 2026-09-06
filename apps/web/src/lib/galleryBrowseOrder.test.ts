/**
 * galleryBrowseOrder のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/galleryBrowseOrder.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  neighborsForId,
  sanitizeBrowseOrderIds,
} from "./galleryBrowseOrder.ts";

describe("neighborsForId", () => {
  it("returns prev and next", () => {
    assert.deepEqual(neighborsForId([10, 20, 30], 20), {
      prev_id: 10,
      next_id: 30,
    });
  });

  it("returns null at edges", () => {
    assert.deepEqual(neighborsForId([10, 20], 10), {
      prev_id: null,
      next_id: 20,
    });
    assert.deepEqual(neighborsForId([10, 20], 20), {
      prev_id: 10,
      next_id: null,
    });
  });

  it("returns nulls when id missing", () => {
    assert.deepEqual(neighborsForId([10, 20], 99), {
      prev_id: null,
      next_id: null,
    });
  });
});

describe("sanitizeBrowseOrderIds", () => {
  it("keeps positive ints unique in order", () => {
    assert.deepEqual(sanitizeBrowseOrderIds([2, "2", 0, -1, 3, 2]), [2, 3]);
  });
});
