/**
 * assistMessages の自己検査（依存ランナーなし）。
 * 実行: node --experimental-strip-types apps/web/src/components/register/assistMessages.selftest.ts
 */
import assert from "node:assert/strict";
import {
  assistStatusDescriptor,
  assistStatusKey,
  resolveAssistMessage,
} from "./assistMessages.ts";

assert.equal(assistStatusKey("live_disabled"), "liveDisabled");
assert.equal(assistStatusKey("missing_credentials"), "missingCredentials");
assert.equal(assistStatusKey("not_ready"), "notReady");
assert.equal(assistStatusKey("error"), "error");
assert.equal(assistStatusKey("success"), "success");
assert.equal(assistStatusKey(undefined), "default");
assert.equal(assistStatusKey("unknown_status"), "default");

assert.deepEqual(assistStatusDescriptor("live_disabled"), { key: "liveDisabled" });
assert.deepEqual(assistStatusDescriptor("error", "  API detail  "), {
  key: "error",
  fallback: "API detail",
});
assert.deepEqual(assistStatusDescriptor("success", "候補 3 件"), {
  key: "success",
  fallback: "候補 3 件",
});
assert.deepEqual(assistStatusDescriptor("not_ready", "ignored"), {
  key: "notReady",
});

assert.equal(
  resolveAssistMessage((k) => `t:${k}`, { key: "liveDisabled" }),
  "t:liveDisabled",
);
assert.equal(
  resolveAssistMessage((k) => `t:${k}`, { key: "error", fallback: "from API" }),
  "from API",
);

console.log("assistMessages.selftest: OK");
