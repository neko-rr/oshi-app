/**
 * apiFetch は Workers でリクエストまたぎの Response ストリームを再利用しない。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/api.test.ts
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { apiFetch } from "./api.ts";

describe("apiFetch", () => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  let lastInit: RequestInit | undefined;

  before(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://example.test";
    globalThis.fetch = (async (_input, init) => {
      lastInit = init;
      return new Response("{}", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;
  });

  after(() => {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_API_BASE_URL = originalBase;
    }
  });

  it("cache は no-store（Workers の I/O またぎ禁止）", async () => {
    await apiFetch("/health");
    assert.equal(lastInit?.cache, "no-store");
  });
});
