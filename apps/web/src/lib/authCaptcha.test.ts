/**
 * Auth CAPTCHA ヘルパのユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/authCaptcha.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  authCaptchaBlockReason,
  isTurnstileConfigured,
  readTurnstileSiteKey,
  resolveCaptchaToken,
} from "./authCaptcha.ts";

describe("authCaptcha", () => {
  it("readTurnstileSiteKey は前後空白を落とす", () => {
    assert.equal(readTurnstileSiteKey("  0xabc  "), "0xabc");
    assert.equal(readTurnstileSiteKey(undefined), "");
    assert.equal(readTurnstileSiteKey(null), "");
  });

  it("isTurnstileConfigured は非空のみ true", () => {
    assert.equal(isTurnstileConfigured(""), false);
    assert.equal(isTurnstileConfigured("0xkey"), true);
  });

  it("resolveCaptchaToken は空を null にする", () => {
    assert.equal(resolveCaptchaToken(" tok "), "tok");
    assert.equal(resolveCaptchaToken(""), null);
    assert.equal(resolveCaptchaToken(undefined), null);
  });

  it("authCaptchaBlockReason は Site Key 未設定を先に返す", () => {
    assert.equal(authCaptchaBlockReason("", "token"), "missing_site_key");
    assert.equal(authCaptchaBlockReason("  ", null), "missing_site_key");
  });

  it("authCaptchaBlockReason はトークン未取得を返す", () => {
    assert.equal(authCaptchaBlockReason("0xkey", null), "missing_token");
    assert.equal(authCaptchaBlockReason("0xkey", "  "), "missing_token");
  });

  it("authCaptchaBlockReason は揃っていれば null", () => {
    assert.equal(authCaptchaBlockReason("0xkey", "tok"), null);
  });
});
