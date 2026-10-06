/**
 * カラータグ割合の表示ヘルパ。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/colorTagShare.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatSharePercent,
  isColorTagShareItem,
  pieConicGradient,
} from "./colorTagShare.ts";

describe("colorTagShare", () => {
  it("formats percent and builds a conic gradient", () => {
    assert.equal(formatSharePercent(0.6667), "66.7%");
    assert.equal(formatSharePercent(0), "0%");
    const items = [
      {
        slot: 1,
        color_tag_name: "赤",
        color_tag_color: "#dc3545",
        count: 2,
        share: 0.5,
      },
      {
        slot: 2,
        color_tag_name: "青",
        color_tag_color: "#0d6efd",
        count: 2,
        share: 0.5,
      },
    ];
    assert.equal(isColorTagShareItem(items[0]), true);
    const pie = pieConicGradient(items);
    assert.ok(pie && pie.includes("#dc3545"));
    assert.ok(pie && pie.includes("conic-gradient"));
  });
});
