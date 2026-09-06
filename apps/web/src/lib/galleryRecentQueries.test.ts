/**
 * galleryRecentQueries のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/galleryRecentQueries.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fingerprintGalleryQuery,
  isRecordableRecentQuery,
  pushRecentGalleryQuery,
  sanitizeRecentEntries,
} from "./galleryRecentQueries.ts";

describe("fingerprintGalleryQuery", () => {
  it("ignores offset conceptually via normalize fields only", () => {
    assert.equal(
      fingerprintGalleryQuery({ q: "a", category_tag_ids: [1, 2] }),
      "a|1,2|||",
    );
  });
});

describe("isRecordableRecentQuery", () => {
  it("requires q or filters", () => {
    assert.equal(isRecordableRecentQuery({}), false);
    assert.equal(isRecordableRecentQuery({ sort: "newest" }), false);
    assert.equal(isRecordableRecentQuery({ q: "x" }), true);
    assert.equal(
      isRecordableRecentQuery({ category_tag_ids: [1] }),
      true,
    );
  });
});

describe("pushRecentGalleryQuery", () => {
  it("dedupes and puts newest first", () => {
    const first = pushRecentGalleryQuery([], { q: "one" }, "one", 1);
    const second = pushRecentGalleryQuery(first, { q: "two" }, "two", 2);
    const again = pushRecentGalleryQuery(second, { q: "one" }, "one!", 3);
    assert.equal(again.length, 2);
    assert.equal(again[0]?.label, "one!");
    assert.equal(again[1]?.label, "two");
  });
});

describe("sanitizeRecentEntries", () => {
  it("drops empty queries", () => {
    assert.deepEqual(
      sanitizeRecentEntries([
        { fingerprint: "x", query: {}, label: "x", saved_at: 1 },
        {
          fingerprint: "q|",
          query: { q: "hi" },
          label: "hi",
          saved_at: 2,
        },
      ]),
      [
        {
          fingerprint: "q|",
          query: { q: "hi" },
          label: "hi",
          saved_at: 2,
        },
      ],
    );
  });
});
