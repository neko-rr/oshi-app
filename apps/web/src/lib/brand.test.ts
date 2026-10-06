/**
 * ブランド定数のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/brand.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DISPLAY_SETTINGS_LOCAL_KEY,
  LOCAL_STORAGE_PREFIX,
  BRAND_LOGO_SRC,
  MASCOT_LOCAL_KEY,
  PRODUCT_NAME,
  PRODUCT_ORIGIN,
  SITE_INDEXABLE,
  THEME_LOCAL_KEY,
} from "./brand.ts";
import { GALLERY_BROWSE_ORDER_KEY } from "./galleryBrowseOrder.ts";
import { GALLERY_RECENT_QUERIES_KEY } from "./galleryRecentQueries.ts";

describe("brand storage keys", () => {
  it("localStorage 接頭辞は Oshihaven で、旧 oshiapp は使わない", () => {
    assert.equal(PRODUCT_NAME, "Oshihaven");
    assert.equal(PRODUCT_ORIGIN, "https://oshihaven.com");
    assert.equal(SITE_INDEXABLE, false);
    assert.equal(BRAND_LOGO_SRC, "/brand/logo.png");
    assert.equal(LOCAL_STORAGE_PREFIX, "oshihaven:");
    assert.equal(THEME_LOCAL_KEY, "oshihaven:themeId");
    assert.equal(MASCOT_LOCAL_KEY, "oshihaven:mascotId");
    assert.equal(DISPLAY_SETTINGS_LOCAL_KEY, "oshihaven:displaySettings");
    assert.equal(THEME_LOCAL_KEY.startsWith("oshiapp:"), false);
    assert.equal(
      GALLERY_BROWSE_ORDER_KEY,
      `${LOCAL_STORAGE_PREFIX}galleryBrowseOrder`,
    );
    assert.equal(
      GALLERY_RECENT_QUERIES_KEY,
      `${LOCAL_STORAGE_PREFIX}galleryRecentQueries`,
    );
  });
});