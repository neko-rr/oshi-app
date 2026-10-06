/**
 * サーバーでの Auth 取得（Cookie の user を信用しない）。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/serverAuth.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickServerAuth } from "./serverAuth.ts";

describe("pickServerAuth", () => {
  it("getUser が無いときは null。トークンは session からだけ取る", () => {
    assert.equal(pickServerAuth(null, null), null);
    assert.equal(
      pickServerAuth(null, {
        access_token: "tok",
        user: { id: "x", is_anonymous: false },
      }),
      null,
    );
    const auth = pickServerAuth(
      { id: "u1", email: "a@b.c", is_anonymous: true },
      { access_token: "tok", user: { id: "spoof" } },
    );
    assert.deepEqual(auth, {
      user: { id: "u1", email: "a@b.c", is_anonymous: true },
      accessToken: "tok",
    });
  });
});
