/**
 * 実行: node --experimental-strip-types --test apps/web/src/lib/barcode/detect_timeout.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withTimeout } from "./detect_timeout.ts";

describe("withTimeout", () => {
  it("期限内に解決したらその値を返す", async () => {
    const value = await withTimeout(Promise.resolve(42), 200, "ok");
    assert.equal(value, 42);
  });

  it("超過したら reject する", async () => {
    await assert.rejects(
      () =>
        withTimeout(
          new Promise(() => {
            /* 永続 pending */
          }),
          30,
          "hang",
        ),
      /hang: 30ms/,
    );
  });

  it("timeoutMs が不正なら即失敗", async () => {
    await assert.rejects(() => withTimeout(Promise.resolve(1), 0), /正の数/);
    await assert.rejects(() => withTimeout(Promise.resolve(1), -1), /正の数/);
  });
});
