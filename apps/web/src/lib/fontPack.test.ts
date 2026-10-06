/**
 * 文字パック ID の allowlist。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/fontPack.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_FONT_PACK,
  FONT_PACK_IDS,
  sanitizeFontPack,
} from "./displayPrefs.ts";

describe("sanitizeFontPack", () => {
  it("allows the four shipped packs", () => {
    assert.deepEqual([...FONT_PACK_IDS], [
      "clean",
      "soft",
      "magazine",
      "readable",
    ]);
    assert.equal(DEFAULT_FONT_PACK, "clean");
    assert.equal(sanitizeFontPack("clean"), "clean");
    assert.equal(sanitizeFontPack("soft"), "soft");
    assert.equal(sanitizeFontPack("magazine"), "magazine");
    assert.equal(sanitizeFontPack("readable"), "readable");
  });

  it("falls back to clean on unknown or empty values", () => {
    assert.equal(sanitizeFontPack("comic"), "clean");
    assert.equal(sanitizeFontPack(""), "clean");
    assert.equal(sanitizeFontPack(null), "clean");
    assert.equal(sanitizeFontPack(undefined), "clean");
  });
});
