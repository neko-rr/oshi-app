/**
 * E2E 認証スタブの契約。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/e2eAuthStub.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  E2E_AUTH_COOKIE,
  E2E_STUB_ACCESS_TOKEN,
  parseE2eAuthRole,
  readE2eAuthCookieFromHeader,
  stubSessionFromRole,
} from "./e2eAuthStub.ts";

describe("parseE2eAuthRole", () => {
  it("guest / permanent だけ通す", () => {
    assert.equal(parseE2eAuthRole("guest"), "guest");
    assert.equal(parseE2eAuthRole("permanent"), "permanent");
    assert.equal(parseE2eAuthRole("admin"), null);
    assert.equal(parseE2eAuthRole(""), null);
    assert.equal(parseE2eAuthRole(null), null);
  });
});

describe("stubSessionFromRole", () => {
  it("guest は匿名、permanent は本登録相当", () => {
    const guest = stubSessionFromRole("guest");
    assert.equal(guest.accessToken, E2E_STUB_ACCESS_TOKEN);
    assert.equal(guest.isAnonymous, true);

    const perm = stubSessionFromRole("permanent");
    assert.equal(perm.accessToken, E2E_STUB_ACCESS_TOKEN);
    assert.equal(perm.isAnonymous, false);
  });
});

describe("readE2eAuthCookieFromHeader", () => {
  it("対象 Cookie を読む", () => {
    assert.equal(
      readE2eAuthCookieFromHeader(`${E2E_AUTH_COOKIE}=guest; other=1`),
      "guest",
    );
    assert.equal(
      readE2eAuthCookieFromHeader(`a=b; ${E2E_AUTH_COOKIE}=permanent`),
      "permanent",
    );
    assert.equal(readE2eAuthCookieFromHeader("other=guest"), null);
    assert.equal(readE2eAuthCookieFromHeader(""), null);
  });
});
