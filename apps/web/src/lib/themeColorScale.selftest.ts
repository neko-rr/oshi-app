/**
 * themeColorScale 自己検査（TDD）。
 * 実行: pnpm -C apps/web exec jiti src/lib/themeColorScale.selftest.ts
 */
import assert from "node:assert/strict";
import {
  SCALE_STEPS,
  generateBrandScale,
  buildPreviewPackFromSeed,
  buildPreviewPackFromLabTheme,
  pickScaleStepForSeed,
} from "./themeColorScale.ts";
import { contrastRatio, normalizeHex } from "./oshiContrast.ts";

assert.deepEqual(
  [...SCALE_STEPS],
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
);

const scale = generateBrandScale("#790c1e");
assert.equal(normalizeHex(scale[500]), "#790c1e");
assert.equal(Object.keys(scale).length, SCALE_STEPS.length);

// 明るい段ほど輝度が高い（50 > 950）
assert.ok(
  contrastRatio(scale[50], "#000000") > contrastRatio(scale[950], "#000000"),
);

// シードが 500 付近に載る
assert.equal(pickScaleStepForSeed("#790c1e", scale), 500);

const lightPack = buildPreviewPackFromSeed("#790c1e", "light");
assert.equal(lightPack.primary, "#790c1e");
assert.ok(contrastRatio(lightPack.fg, lightPack.bg) >= 4.5);
assert.ok(contrastRatio(lightPack.primaryFg, lightPack.primary) >= 4.5);

const darkPack = buildPreviewPackFromSeed("#790c1e", "dark");
assert.equal(darkPack.scheme, "dark");
assert.ok(contrastRatio(darkPack.fg, darkPack.bg) >= 4.5);

const fromLab = buildPreviewPackFromLabTheme({
  scheme: "light",
  primary: "#b8e05c",
  primaryFg: "#2a2620",
  bg: "#f7f7f5",
  fg: "#2a2620",
  muted: "#6b6660",
  surface: "#ffffff",
  border: "#d4d0c8",
});
assert.equal(fromLab.bg, "#f7f7f5");
assert.equal(fromLab.primary, "#b8e05c");
assert.equal(fromLab.seed, "#b8e05c");
assert.notEqual(fromLab.bg, lightPack.bg);

console.log("themeColorScale.selftest: ok");
