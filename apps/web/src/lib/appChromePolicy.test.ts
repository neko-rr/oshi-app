/**
 * 未ログイン時のシェル／ホーム CTA。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/appChromePolicy.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shouldHideBottomTabs,
  shouldShowAppChromeNav,
} from "./appChromePolicy.ts";

describe("shouldShowAppChromeNav", () => {
  it("セッションがあるときだけギャラリー等のナビを出す", () => {
    assert.equal(shouldShowAppChromeNav(false), false);
    assert.equal(shouldShowAppChromeNav(true), true);
  });
});

describe("shouldHideBottomTabs", () => {
  it("未ログインでは常に隠す。ログイン後は auth/dev だけ隠す", () => {
    assert.equal(shouldHideBottomTabs("/gallery", false), true);
    assert.equal(shouldHideBottomTabs("/", false), true);
    assert.equal(shouldHideBottomTabs("/gallery", true), false);
    assert.equal(shouldHideBottomTabs("/auth/login", true), true);
    assert.equal(shouldHideBottomTabs("/dev/design-lab", true), true);
  });
});
