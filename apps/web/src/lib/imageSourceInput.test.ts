/**
 * 画像の入り口。ファイル選択に capture を付けるとスマホはカメラだけ開く。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/imageSourceInput.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { imageInputCapture } from "./imageSourceInput.ts";

describe("imageInputCapture", () => {
  it("ファイル選択には capture を付けない", () => {
    assert.equal(imageInputCapture("file"), undefined);
  });

  it("カメラで撮るは背面カメラを開く", () => {
    assert.equal(imageInputCapture("camera"), "environment");
  });
});
