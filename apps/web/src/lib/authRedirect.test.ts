/**
 * OAuth / メール確認の next パスと Google callback URL。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/authRedirect.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  googleOAuthCallbackUrl,
  sanitizeAuthRedirectPath,
  sanitizePreparingNext,
} from "./authRedirect.ts";

describe("sanitizeAuthRedirectPath", () => {
  it("相対パスだけ通し、外部 URL は / にする", () => {
    assert.equal(sanitizeAuthRedirectPath("/gallery"), "/gallery");
    assert.equal(sanitizeAuthRedirectPath("/en/settings"), "/en/settings");
    assert.equal(sanitizeAuthRedirectPath(null), "/");
    assert.equal(sanitizeAuthRedirectPath(""), "/");
    assert.equal(sanitizeAuthRedirectPath("https://evil.example/"), "/");
    assert.equal(sanitizeAuthRedirectPath("//evil.example"), "/");
    assert.equal(sanitizeAuthRedirectPath("gallery"), "/");
  });

  it("パーセントエンコードした // や ://・パス走査も拒否する", () => {
    assert.equal(sanitizeAuthRedirectPath("/%2F%2Fevil.example"), "/");
    assert.equal(sanitizeAuthRedirectPath("%2F%2Fevil.example"), "/");
    assert.equal(sanitizeAuthRedirectPath("/%2f%2fevil.example"), "/");
    assert.equal(sanitizeAuthRedirectPath("/gallery%2F..%2F.."), "/");
    assert.equal(sanitizeAuthRedirectPath("/https%3A%2F%2Fevil.example"), "/");
  });
});

describe("sanitizePreparingNext", () => {
  it("preparing 自身へのループは / にする", () => {
    assert.equal(sanitizePreparingNext("/auth/preparing"), "/");
    assert.equal(sanitizePreparingNext("/auth/preparing?next=/gallery"), "/");
    assert.equal(sanitizePreparingNext("/en/auth/preparing"), "/");
    assert.equal(sanitizePreparingNext("/gallery"), "/gallery");
  });
});

describe("googleOAuthCallbackUrl", () => {
  it("ja はプレフィックスなし、en は /en、next をクエリに載せる", () => {
    assert.equal(
      googleOAuthCallbackUrl("https://oshihaven.com", "ja", "/"),
      "https://oshihaven.com/auth/callback?next=%2F",
    );
    assert.equal(
      googleOAuthCallbackUrl("https://oshihaven.com", "en", "/gallery"),
      "https://oshihaven.com/en/auth/callback?next=%2Fgallery",
    );
    assert.equal(
      googleOAuthCallbackUrl("https://oshihaven.com", "ja", "https://evil.example"),
      "https://oshihaven.com/auth/callback?next=%2F",
    );
  });
});
