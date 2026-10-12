/**
 * Google Auth 開始の契約（ゲスト本登録は linkIdentity）。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/googleAuth.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveGoogleAuthMode,
  startGoogleAuth,
  type GoogleAuthClient,
} from "./googleAuth.ts";

describe("resolveGoogleAuthMode", () => {
  it("upgrade は linkIdentity、login は signIn", () => {
    assert.equal(resolveGoogleAuthMode("upgrade"), "linkIdentity");
    assert.equal(resolveGoogleAuthMode("login"), "signIn");
  });
});

describe("startGoogleAuth", () => {
  it("mode=linkIdentity のとき linkIdentity を呼ぶ（signInWithOAuth は呼ばない）", async () => {
    const calls: string[] = [];
    const client: GoogleAuthClient = {
      auth: {
        async signInWithOAuth() {
          calls.push("signInWithOAuth");
          return { error: null };
        },
        async linkIdentity(args) {
          calls.push(`linkIdentity:${args.options.redirectTo}`);
          return { error: null };
        },
      },
    };
    const { error } = await startGoogleAuth(client, {
      mode: "linkIdentity",
      redirectTo: "https://oshihaven.com/auth/callback?next=%2F",
    });
    assert.equal(error, null);
    assert.deepEqual(calls, [
      "linkIdentity:https://oshihaven.com/auth/callback?next=%2F",
    ]);
  });

  it("mode=signIn のとき signInWithOAuth を呼ぶ", async () => {
    const calls: string[] = [];
    const client: GoogleAuthClient = {
      auth: {
        async signInWithOAuth(args) {
          calls.push(`signInWithOAuth:${args.options.redirectTo}`);
          return { error: null };
        },
        async linkIdentity() {
          calls.push("linkIdentity");
          return { error: null };
        },
      },
    };
    const { error } = await startGoogleAuth(client, {
      mode: "signIn",
      redirectTo: "https://example.com/auth/callback?next=%2F",
    });
    assert.equal(error, null);
    assert.deepEqual(calls, [
      "signInWithOAuth:https://example.com/auth/callback?next=%2F",
    ]);
  });

  it("不正な redirectTo は拒否する", async () => {
    const client: GoogleAuthClient = {
      auth: {
        async signInWithOAuth() {
          return { error: null };
        },
        async linkIdentity() {
          return { error: null };
        },
      },
    };
    const { error } = await startGoogleAuth(client, {
      mode: "linkIdentity",
      redirectTo: "/auth/callback",
    });
    assert.ok(error);
    assert.equal(error?.message, "invalid_redirect");
  });
});
