/**
 * auth-path-policy の自己検査（依存ランナーなし）。
 * 実行: node --experimental-strip-types apps/web/src/lib/auth-path-policy.selftest.ts
 */
import assert from "node:assert/strict";
import {
  allowsAnonymousWhenNotProduction,
  getLocaleFromPath,
  isAlwaysPublicPath,
  isDevOnlyPath,
  shouldBlockDevPathInProduction,
  stripLocalePrefix,
  withLocalePrefix,
} from "./auth-path-policy.ts";

assert.equal(isDevOnlyPath("/dev/design-lab"), true);
assert.equal(isDevOnlyPath("/gallery"), false);

assert.equal(isAlwaysPublicPath("/privacy"), true);
assert.equal(isAlwaysPublicPath("/licenses"), true);
assert.equal(isAlwaysPublicPath("/gallery"), false);

assert.equal(allowsAnonymousWhenNotProduction("/dev/design-lab"), true);
assert.equal(allowsAnonymousWhenNotProduction("/gallery"), false);
assert.equal(allowsAnonymousWhenNotProduction("/auth/login"), true);

assert.equal(shouldBlockDevPathInProduction("/dev/design-lab", true), true);
assert.equal(shouldBlockDevPathInProduction("/dev/design-lab", false), false);
assert.equal(shouldBlockDevPathInProduction("/gallery", true), false);

assert.equal(stripLocalePrefix("/en/gallery"), "/gallery");
assert.equal(stripLocalePrefix("/en"), "/");
assert.equal(stripLocalePrefix("/gallery"), "/gallery");
assert.equal(stripLocalePrefix("/ja/settings"), "/settings");
assert.equal(stripLocalePrefix("/english/x"), "/english/x");

assert.equal(getLocaleFromPath("/en/gallery"), "en");
assert.equal(getLocaleFromPath("/gallery"), null);

assert.equal(withLocalePrefix("en", "/auth/login"), "/en/auth/login");
assert.equal(withLocalePrefix("ja", "/auth/login"), "/auth/login");
assert.equal(withLocalePrefix("en", "/"), "/en");
assert.equal(
  allowsAnonymousWhenNotProduction(stripLocalePrefix("/en/auth/login")),
  true,
);
assert.equal(
  allowsAnonymousWhenNotProduction(stripLocalePrefix("/en/gallery")),
  false,
);

console.log("auth-path-policy.selftest: OK");
