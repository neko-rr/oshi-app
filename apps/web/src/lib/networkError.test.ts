/**
 * networkError のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/networkError.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isLikelyOfflineError,
  networkUserMessage,
} from "./networkError.ts";

describe("isLikelyOfflineError", () => {
  it("detects Failed to fetch TypeError", () => {
    const err = new TypeError("Failed to fetch");
    assert.equal(isLikelyOfflineError(err), true);
  });

  it("detects NetworkError message", () => {
    const err = new Error("NetworkError when attempting to fetch resource.");
    assert.equal(isLikelyOfflineError(err), true);
  });

  it("does not flag normal business errors", () => {
    const err = new Error("製品名は必須です");
    assert.equal(isLikelyOfflineError(err), false);
  });
});

describe("networkUserMessage", () => {
  it("returns offline copy for fetch failures", () => {
    const msg = networkUserMessage(new TypeError("Failed to fetch"), {
      offline: "オフライン案内",
      fallback: "一般",
    });
    assert.equal(msg, "オフライン案内");
  });

  it("returns original message otherwise", () => {
    const msg = networkUserMessage(new Error("更新失敗: 500"), {
      offline: "オフライン案内",
      fallback: "一般",
    });
    assert.equal(msg, "更新失敗: 500");
  });
});
