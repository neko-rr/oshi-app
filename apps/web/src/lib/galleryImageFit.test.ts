/**
 * galleryImageFit のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/galleryImageFit.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveGalleryObjectFit } from "./galleryImageFit.ts";

describe("resolveGalleryObjectFit", () => {
  it("forces contain for large layout", () => {
    assert.equal(resolveGalleryObjectFit("large", "cover"), "contain");
  });

  it("respects fit for grid and list", () => {
    assert.equal(resolveGalleryObjectFit("grid", "cover"), "cover");
    assert.equal(resolveGalleryObjectFit("grid", "contain"), "contain");
    assert.equal(resolveGalleryObjectFit("list", "contain"), "contain");
  });
});
