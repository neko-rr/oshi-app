/**
 * 詳細の写真差し替え（アップロード後に photo_id だけ更新）。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/replaceProductPhoto.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { replaceProductPhoto } from "./replaceProductPhoto.ts";

const file = new File([new Uint8Array([1, 2, 3])], "shot.jpg", {
  type: "image/jpeg",
});

describe("replaceProductPhoto", () => {
  it("uploads then patches only photo_id", async () => {
    const calls: { url: string; method: string; body: BodyInit | null | undefined }[] =
      [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push({ url, method: init?.method ?? "GET", body: init?.body });
      if (url.endsWith("/photos")) {
        return new Response(JSON.stringify({ photo_id: 42 }), { status: 200 });
      }
      return new Response("{}", { status: 200 });
    };

    const result = await replaceProductPhoto({
      photosUrl: "https://api.example.test/photos",
      productUrl: "https://api.example.test/products/7",
      accessToken: "user-token",
      file,
      fetchImpl,
    });

    assert.deepEqual(result, { ok: true, photo_id: 42 });
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.method, "POST");
    assert.equal(calls[1]?.method, "PATCH");
    assert.equal(calls[1]?.url, "https://api.example.test/products/7");
    assert.equal(String(calls[1]?.body), JSON.stringify({ photo_id: 42 }));
  });

  it("does not patch when upload fails", async () => {
    let patches = 0;
    const fetchImpl: typeof fetch = async (input) => {
      if (String(input).endsWith("/photos")) {
        return new Response("no", { status: 400 });
      }
      patches += 1;
      return new Response("{}", { status: 200 });
    };
    const result = await replaceProductPhoto({
      photosUrl: "https://api.example.test/photos",
      productUrl: "https://api.example.test/products/7",
      accessToken: "user-token",
      file,
      fetchImpl,
    });
    assert.deepEqual(result, { ok: false, stage: "upload" });
    assert.equal(patches, 0);
  });

  it("rejects an empty token before any request", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return new Response("{}", { status: 200 });
    };
    const result = await replaceProductPhoto({
      photosUrl: "https://api.example.test/photos",
      productUrl: "https://api.example.test/products/7",
      accessToken: "  ",
      file,
      fetchImpl,
    });
    assert.deepEqual(result, { ok: false, stage: "invalid" });
    assert.equal(calls, 0);
  });
});
