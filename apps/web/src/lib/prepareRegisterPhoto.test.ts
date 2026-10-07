/**
 * prepareRegisterPhoto の純関数テスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/prepareRegisterPhoto.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FREE_PHOTO_MAX_EDGE,
  FREE_PHOTO_TARGET_BYTES,
  PHOTO_QUALITY_TIERS,
  PHOTO_STORAGE_QUOTA_BYTES,
  PHOTO_UPLOAD_HARD_MAX_BYTES,
  canSkipReencode,
  canvasSizeAfterRotate,
  normalizeRotateDegrees,
  paidTiersRaiseMaxEdge,
  resolvePhotoQualityTier,
  resolvePhotoStorageQuotaBytes,
  scaleToMaxEdge,
} from "./prepareRegisterPhoto.ts";

describe("prepareRegisterPhoto helpers", () => {
  it("scaleToMaxEdge は長辺だけ上限に収める", () => {
    assert.deepEqual(scaleToMaxEdge(4000, 3000, 2048), {
      width: 2048,
      height: 1536,
    });
    assert.deepEqual(scaleToMaxEdge(800, 600, 2048), {
      width: 800,
      height: 600,
    });
  });

  it("無料ティア定数は API 10MB より小さい", () => {
    assert.equal(FREE_PHOTO_MAX_EDGE, 2048);
    assert.ok(FREE_PHOTO_TARGET_BYTES < PHOTO_UPLOAD_HARD_MAX_BYTES);
    assert.ok(
      PHOTO_QUALITY_TIERS.free.target_bytes <= PHOTO_UPLOAD_HARD_MAX_BYTES,
    );
  });

  it("canSkipReencode は小さい JPEG のみ true", () => {
    const tier = PHOTO_QUALITY_TIERS.free;
    assert.equal(
      canSkipReencode(
        { size: 500_000, type: "image/jpeg" },
        1200,
        900,
        tier,
      ),
      true,
    );
    assert.equal(
      canSkipReencode(
        { size: 500_000, type: "image/png" },
        1200,
        900,
        tier,
      ),
      false,
    );
    assert.equal(
      canSkipReencode(
        { size: FREE_PHOTO_TARGET_BYTES + 1, type: "image/jpeg" },
        1200,
        900,
        tier,
      ),
      false,
    );
    assert.equal(
      canSkipReencode(
        { size: 500_000, type: "image/jpeg" },
        3000,
        2000,
        tier,
      ),
      false,
    );
  });

  it("有料化は長辺で差を付ける（2MB vs 3MB だけの差にしない）", () => {
    assert.equal(paidTiersRaiseMaxEdge(), true);
    assert.ok(
      PHOTO_QUALITY_TIERS.standard.max_edge - PHOTO_QUALITY_TIERS.free.max_edge >=
        512,
    );
    assert.ok(
      PHOTO_QUALITY_TIERS.high.max_edge - PHOTO_QUALITY_TIERS.standard.max_edge >=
        512,
    );
  });

  it("resolvePhotoQualityTier は未知を free にする", () => {
    assert.equal(resolvePhotoQualityTier(null).id, "free");
    assert.equal(resolvePhotoQualityTier("nope").id, "free");
    assert.equal(resolvePhotoQualityTier("standard").id, "standard");
    assert.equal(resolvePhotoQualityTier("high").max_edge, 4096);
  });

  it("normalizeRotateDegrees は 90 度単位に正規化する", () => {
    assert.equal(normalizeRotateDegrees(90), 90);
    assert.equal(normalizeRotateDegrees(-90), 270);
    assert.equal(normalizeRotateDegrees(180), 180);
    assert.equal(normalizeRotateDegrees(45), 0);
  });

  it("canvasSizeAfterRotate は 90/270 で縦横を入れ替える", () => {
    assert.deepEqual(canvasSizeAfterRotate(1920, 1080, 90), {
      width: 1080,
      height: 1920,
    });
    assert.deepEqual(canvasSizeAfterRotate(1920, 1080, -90), {
      width: 1080,
      height: 1920,
    });
    assert.deepEqual(canvasSizeAfterRotate(1920, 1080, 180), {
      width: 1920,
      height: 1080,
    });
  });

  it("容量クォータ案は有料の方が大きい", () => {
    assert.ok(
      resolvePhotoStorageQuotaBytes("standard") >
        resolvePhotoStorageQuotaBytes("free"),
    );
    assert.ok(
      PHOTO_STORAGE_QUOTA_BYTES.high > PHOTO_STORAGE_QUOTA_BYTES.standard,
    );
  });
});
