/**
 * wakeApi のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/wakeApi.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shouldShowApiWakeOverlay,
  shouldWakeApiOnAuth,
  waitForApiReady,
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

  it("shouldShowApiWakeOverlay は遅延未満なら false", () => {
    assert.equal(shouldShowApiWakeOverlay(0, 400), false);
    assert.equal(shouldShowApiWakeOverlay(399, 400), false);
    assert.equal(shouldShowApiWakeOverlay(400, 400), true);
  });

  it("waitForApiReady は初回 200 ですぐ ready", async () => {
    let calls = 0;
    const result = await waitForApiReady({
      enabled: true,
      apiBase: "https://api.example.com",
      maxMs: 5_000,
      attemptTimeoutMs: 500,
      intervalMs: 10,
      fetchImpl: async () => {
        calls += 1;
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      },
    });
    assert.equal(result.ready, true);
    assert.equal(calls, 1);
    assert.equal(result.attempts, 1);
  });

  it("waitForApiReady は失敗のあと成功したら ready", async () => {
    let calls = 0;
    const result = await waitForApiReady({
      enabled: true,
      apiBase: "https://api.example.com",
      maxMs: 5_000,
      attemptTimeoutMs: 200,
      intervalMs: 10,
      fetchImpl: async () => {
        calls += 1;
        if (calls < 3) {
          throw new TypeError("Failed to fetch");
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      },
    });
    assert.equal(result.ready, true);
    assert.equal(result.attempts, 3);
  });

  it("waitForApiReady は上限超過で ready=false", async () => {
    const result = await waitForApiReady({
      enabled: true,
      apiBase: "https://api.example.com",
      maxMs: 80,
      attemptTimeoutMs: 30,
      intervalMs: 5,
      fetchImpl: async () => {
        throw new TypeError("Failed to fetch");
      },
    });
    assert.equal(result.ready, false);
    assert.ok(result.attempts >= 1);
  });

  it("waitForApiReady は enabled=false なら即 ready", async () => {
    let called = false;
    const result = await waitForApiReady({
      enabled: false,
      apiBase: "https://api.example.com",
      fetchImpl: async () => {
        called = true;
        return new Response("ok");
      },
    });
    assert.equal(result.ready, true);
    assert.equal(called, false);
    assert.equal(result.attempts, 0);
  });
});
