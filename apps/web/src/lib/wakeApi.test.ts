/**
 * wakeApi のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/wakeApi.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shouldWakeApiOnAuth,
  wakeApi,
  wakeApiHealthUrl,
} from "./wakeApi.ts";

describe("wakeApi", () => {
  it("shouldWakeApiOnAuth は 0 のときだけオフ", () => {
    assert.equal(shouldWakeApiOnAuth(undefined), true);
    assert.equal(shouldWakeApiOnAuth("1"), true);
    assert.equal(shouldWakeApiOnAuth("0"), false);
  });

  it("wakeApiHealthUrl は末尾スラッシュを正規化する", () => {
    assert.equal(
      wakeApiHealthUrl("https://api.example.com/"),
      "https://api.example.com/health",
    );
    assert.equal(wakeApiHealthUrl(""), null);
    assert.equal(wakeApiHealthUrl(undefined), null);
  });

  it("enabled=false なら fetch しない", async () => {
    let called = false;
    await wakeApi({
      enabled: false,
      apiBase: "https://api.example.com",
      fetchImpl: async () => {
        called = true;
        return new Response("ok");
      },
    });
    assert.equal(called, false);
  });

  it("enabled 時は GET /health を叩く", async () => {
    const calls: string[] = [];
    await wakeApi({
      enabled: true,
      apiBase: "https://api.example.com",
      timeoutMs: 1000,
      fetchImpl: async (input, init) => {
        calls.push(String(input));
        assert.equal(init?.method, "GET");
        assert.equal(init?.cache, "no-store");
        return new Response("ok");
      },
    });
    assert.deepEqual(calls, ["https://api.example.com/health"]);
  });
});
