/**
 * displayPrefs（ギャラリーカード表示）の自己検査。
 * 実行: node --experimental-strip-types apps/web/src/lib/displayPrefs.selftest.ts
 */
import assert from "node:assert/strict";
import {
  DEFAULT_GALLERY_SHOW,
  sanitizeGalleryCardFields,
  sanitizeGalleryShow,
} from "./displayPrefs.ts";

assert.equal(sanitizeGalleryShow(true), true);
assert.equal(sanitizeGalleryShow(false), false);
assert.equal(sanitizeGalleryShow("yes"), DEFAULT_GALLERY_SHOW);
assert.equal(sanitizeGalleryShow(1), DEFAULT_GALLERY_SHOW);
assert.equal(sanitizeGalleryShow(undefined), DEFAULT_GALLERY_SHOW);

assert.deepEqual(sanitizeGalleryCardFields(null), {
  gallery_show_name: true,
  gallery_show_tags: true,
  gallery_show_price: true,
});
assert.deepEqual(
  sanitizeGalleryCardFields({
    gallery_show_name: false,
    gallery_show_tags: true,
    gallery_show_price: false,
  }),
  {
    gallery_show_name: false,
    gallery_show_tags: true,
    gallery_show_price: false,
  },
);

console.log("displayPrefs.selftest: ok");
