/**
 * oshiContrast 自己検査。
 * 実行: node --experimental-strip-types apps/web/src/lib/oshiContrast.selftest.ts
 */
import assert from "node:assert/strict";
import {
  bestForeground,
  contrastRatio,
  normalizeHex,
  resolveOshiColors,
} from "./oshiContrast.ts";

assert.equal(normalizeHex("#9F606C"), "#9f606c");
assert.equal(normalizeHex("6a9bb8"), "#6a9bb8");

assert.equal(bestForeground("#1a1614"), "#ffffff");
assert.ok(contrastRatio("#ffffff", "#1a1614") >= 4.5);

assert.equal(bestForeground("#f5f5f5"), "#1a1614");

const resolved = resolveOshiColors("#9f606c", "#6a9bb8");
assert.equal(resolved.main_hex, "#9f606c");
assert.ok(contrastRatio(resolved.main_foreground, resolved.main_hex) >= 4.5);
assert.ok(contrastRatio(resolved.soft_foreground, resolved.soft_bg) >= 4.5);

console.log("oshiContrast.selftest: ok");
