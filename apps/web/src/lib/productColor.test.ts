/**
 * グッズの色マッチ。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/productColor.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchProductColorCodes } from "./productColor.ts";

describe("matchProductColorCodes", () => {
  it("写真の色名を複数のコードにする", () => {
    assert.deepEqual(matchProductColorCodes(["ピンク", "赤", "gold"]), [
      "red",
      "pink",
      "gold",
    ]);
  });

  it("多色ラベルは捨てる", () => {
    assert.deepEqual(matchProductColorCodes(["多色", "カラフル", "mixed"]), []);
  });

  it("髪と瞳を別の色として残す", () => {
    assert.deepEqual(matchProductColorCodes(["髪は黒", "瞳は水色"]), [
      "black",
      "light_blue",
    ]);
  });
});
