/**
 * 404・障害画面のマスコット解決。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/mascotEmotionalScene.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mascotSceneUrl,
  poseForEmotionalScene,
  resolveMascotIdForEmotionalScene,
  UNKNOWN_PREFERENCE_MASCOT_ID,
} from "./mascotCatalog.ts";

describe("mascotEmotionalScene", () => {
  it("設定が読めないときは風ねこ（おとな）", () => {
    assert.equal(UNKNOWN_PREFERENCE_MASCOT_ID, "kaze_neko_adult");
    assert.equal(resolveMascotIdForEmotionalScene(undefined), "kaze_neko_adult");
    assert.equal(resolveMascotIdForEmotionalScene(null), "kaze_neko_adult");
    assert.equal(resolveMascotIdForEmotionalScene(""), "kaze_neko_adult");
    assert.equal(resolveMascotIdForEmotionalScene("bogus"), "kaze_neko_adult");
  });

  it("端末に保存したキャラ（無し含む）を優先する", () => {
    assert.equal(resolveMascotIdForEmotionalScene("none"), "none");
    assert.equal(resolveMascotIdForEmotionalScene("calico"), "calico");
    assert.equal(resolveMascotIdForEmotionalScene("kaze_neko"), "kaze_neko");
    assert.equal(
      resolveMascotIdForEmotionalScene("kaze_neko_adult"),
      "kaze_neko_adult",
    );
    assert.equal(resolveMascotIdForEmotionalScene("cat"), "calico");
  });

  it("404 も障害も not_found 場面を使う", () => {
    assert.equal(poseForEmotionalScene("not_found"), "not_found");
    assert.equal(poseForEmotionalScene("error"), "not_found");
    assert.equal(
      mascotSceneUrl("kaze_neko_adult", poseForEmotionalScene("error")),
      "/brand/mascots/kaze_neko/adult/scenes/not_found.png",
    );
    assert.equal(
      mascotSceneUrl("calico", poseForEmotionalScene("not_found")),
      "/brand/mascots/calico/kit/scenes/not_found.png",
    );
    assert.equal(
      mascotSceneUrl("none", poseForEmotionalScene("not_found")),
      null,
    );
  });
});
