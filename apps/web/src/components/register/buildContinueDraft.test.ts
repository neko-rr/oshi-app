/**
 * buildContinueDraft のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/components/register/buildContinueDraft.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildContinueDraft } from "./buildContinueDraft.ts";
import type { RegisterDraft } from "./types.ts";

function samplePrev(partial: Partial<RegisterDraft> = {}): RegisterDraft {
  return {
    barcode: "",
    barcodeType: null,
    barcodeNote: null,
    suggestedName: "",
    suggestedPrice: "",
    file: null,
    productName: "",
    productGroupName: "",
    characterName: "",
    purchasePrice: "",
    currencyCode: "",
    memo: "",
    selectedSlots: new Set(),
    categoryTagId: null,
    storageLocationId: null,
    visualTags: [],
    unmatchedProductType: null,
    fieldSources: {
      product_name: "empty",
      purchase_price: "empty",
      character_name: "empty",
      product_group_name: "empty",
      memo: "empty",
      category_tag_id: "empty",
      color_tag_slots: "empty",
    },
    ...partial,
  };
}

describe("buildContinueDraft", () => {
  it("keeps storage, category, color slots, and currency", () => {
    const prev = samplePrev({
      productName: "缶バッジA",
      barcode: "490123",
      memo: "メモ",
      purchasePrice: "1200",
      characterName: "キャラ",
      productGroupName: "グループ",
      categoryTagId: 10,
      storageLocationId: 5,
      currencyCode: "USD",
      selectedSlots: new Set([1, 3]),
      visualTags: ["丸"],
      unmatchedProductType: "雑貨",
    });

    const next = buildContinueDraft(prev, {
      currencyCode: "JPY",
      defaultStorageLocationId: 99,
    });

    assert.equal(next.productName, "");
    assert.equal(next.barcode, "");
    assert.equal(next.memo, "");
    assert.equal(next.purchasePrice, "");
    assert.equal(next.characterName, "");
    assert.equal(next.productGroupName, "");
    assert.equal(next.file, null);
    assert.deepEqual(next.visualTags, []);
    assert.equal(next.unmatchedProductType, null);
    assert.equal(next.categoryTagId, 10);
    assert.equal(next.storageLocationId, 5);
    assert.equal(next.currencyCode, "USD");
    assert.deepEqual([...next.selectedSlots].sort(), [1, 3]);
  });

  it("falls back to default storage and currency when prev lacks them", () => {
    const prev = samplePrev();
    const next = buildContinueDraft(prev, {
      currencyCode: "JPY",
      defaultStorageLocationId: 7,
    });
    assert.equal(next.storageLocationId, 7);
    assert.equal(next.currencyCode, "JPY");
    assert.equal(next.categoryTagId, null);
    assert.equal(next.selectedSlots.size, 0);
  });
});
