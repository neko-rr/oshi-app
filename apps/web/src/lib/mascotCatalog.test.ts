/**
 * mascotCatalog のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/mascotCatalog.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_MASCOT_ID,
  mascotLoadingFrameUrls,
  mascotPartUrl,
  mascotSceneUrl,
  mascotSignaturePartUrl,
  sanitizeMascotId,
} from "./mascotCatalog.ts";

describe("mascotCatalog", () => {
  it("sanitizeMascotId は既定が風ねこ、こねこ/おとな/legacy を許可", () => {
    assert.equal(sanitizeMascotId(undefined), DEFAULT_MASCOT_ID);
    assert.equal(sanitizeMascotId("none"), "none");
    assert.equal(sanitizeMascotId("calico"), "calico");
    assert.equal(sanitizeMascotId("calico_adult"), "calico_adult");
    assert.equal(sanitizeMascotId("kaze_neko_adult"), "kaze_neko_adult");
    assert.equal(sanitizeMascotId("scottish_fold_adult"), "scottish_fold_adult");
    assert.equal(sanitizeMascotId("shiba_adult"), "shiba_adult");
    assert.equal(sanitizeMascotId("pomeranian_adult"), "pomeranian_adult");
    assert.equal(sanitizeMascotId("cat"), "calico");
    assert.equal(sanitizeMascotId("dog"), "shiba");
    assert.equal(sanitizeMascotId("unknown"), DEFAULT_MASCOT_ID);
  });

  it("mascotSceneUrl はこねこ=kit・おとな=adult・単系統は直下 scenes", () => {
    assert.equal(
      mascotSceneUrl("kaze_neko", "idle"),
      "/brand/mascots/kaze_neko/kit/scenes/idle.png",
    );
    assert.equal(
      mascotSceneUrl("kaze_neko_adult", "idle"),
      "/brand/mascots/kaze_neko/adult/scenes/idle.png",
    );
    assert.equal(
      mascotSceneUrl("calico", "loading"),
      "/brand/mascots/calico/kit/scenes/loading.png",
    );
    assert.equal(
      mascotSceneUrl("calico_adult", "not_found"),
      "/brand/mascots/calico/adult/scenes/not_found.png",
    );
    assert.equal(
      mascotSceneUrl("jellyfish", "idle"),
      "/brand/mascots/jellyfish/scenes/idle.png",
    );
    assert.equal(mascotSceneUrl("none", "idle"), null);
  });

  it("mascotLoadingFrameUrls は風ねこ（こねこ）が3枚、他は1枚", () => {
    assert.equal(mascotLoadingFrameUrls("kaze_neko").length, 3);
    assert.deepEqual(mascotLoadingFrameUrls("kaze_neko"), [
      "/brand/mascots/kaze_neko/kit/scenes/loading_01.png",
      "/brand/mascots/kaze_neko/kit/scenes/loading_02.png",
      "/brand/mascots/kaze_neko/kit/scenes/loading_03.png",
    ]);
    assert.equal(mascotLoadingFrameUrls("kaze_neko_adult").length, 1);
    assert.equal(mascotLoadingFrameUrls("shiba").length, 1);
    assert.deepEqual(mascotLoadingFrameUrls("none"), []);
  });

  it("mascotSignaturePartUrl は kit/parts を返す（おとなも当面 kit 部品）", () => {
    assert.equal(
      mascotSignaturePartUrl("calico"),
      "/brand/mascots/calico/kit/parts/bell.png",
    );
    assert.equal(
      mascotPartUrl("calico_adult", "bell.png"),
      "/brand/mascots/calico/kit/parts/bell.png",
    );
    assert.equal(mascotSignaturePartUrl("none"), null);
  });
});
