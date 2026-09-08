/**
 * lab-ui-callouts 自己検査。
 * 実行: pnpm -C apps/web exec jiti src/components/design-lab/lab-ui-callouts.selftest.ts
 */
import assert from "node:assert/strict";
import {
  LAB_UI_CALLOUTS,
  circledNumber,
  labUiCalloutGlyph,
  listSceneUiCallouts,
} from "./lab-ui-callouts.ts";

assert.equal(circledNumber(1), "①");
assert.equal(circledNumber(8), "⑧");
assert.equal(circledNumber(21), "㉑");
assert.equal(labUiCalloutGlyph("preview_primary"), "⑧");

const nums = LAB_UI_CALLOUTS.map((m) => m.n);
assert.equal(new Set(nums).size, nums.length);

const theme = listSceneUiCallouts("theme-settings");
assert.ok(theme.some((m) => m.id === "preview_primary"));

console.log("lab-ui-callouts.selftest: ok");
