/**
 * ブラウザセッションの読み取り。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/browserSession.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readBrowserSession } from "./browserSession.ts";

describe("readBrowserSession", () => {
  it("トークンが無いときは未ログイン", () => {
    assert.deepEqual(readBrowserSession(null), {
      status: "ready",
      accessToken: null,
      isAnonymous: false,
    });
    assert.deepEqual(readBrowserSession({ access_token: "  " }), {
      status: "ready",
      accessToken: null,
      isAnonymous: false,
    });
  });

  it("本登録とゲストをトークンと is_anonymous で分ける", () => {
    assert.deepEqual(
      readBrowserSession({
        access_token: " token ",
        user: { is_anonymous: false },
      }),
      { status: "ready", accessToken: "token", isAnonymous: false },
    );
    assert.equal(
      readBrowserSession({
        access_token: "guest",
        user: { is_anonymous: true },
      }).isAnonymous,
      true,
    );
  });
});
