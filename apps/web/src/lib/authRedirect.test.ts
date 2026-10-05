/**
 * OAuth / メール確認の next パスと Google callback URL。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/authRedirect.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  googleOAuthCallbackUrl,
  sanitizeAuthRedirectPath,
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
