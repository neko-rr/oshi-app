/**
 * authGuest のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/authGuest.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canSyncUserPrefsToServer, isAnonymousUser } from "./authGuest.ts";

describe("isAnonymousUser", () => {
  it("is_anonymous true のみゲスト", () => {
    assert.equal(isAnonymousUser({ is_anonymous: true }), true);
    assert.equal(isAnonymousUser({ is_anonymous: false }), false);
    assert.equal(isAnonymousUser({ is_anonymous: null }), false);
    assert.equal(isAnonymousUser(null), false);
    assert.equal(isAnonymousUser(undefined), false);
  });
});

describe("canSyncUserPrefsToServer", () => {
  it("本登録ユーザーのみ true", () => {
    assert.equal(canSyncUserPrefsToServer({ is_anonymous: false }), true);
    assert.equal(canSyncUserPrefsToServer({}), true);
  });

  it("ゲスト・未ログインは false", () => {
    assert.equal(canSyncUserPrefsToServer({ is_anonymous: true }), false);
    assert.equal(canSyncUserPrefsToServer(null), false);
    assert.equal(canSyncUserPrefsToServer(undefined), false);
  });
});
