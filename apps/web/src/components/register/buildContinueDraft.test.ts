/**
 * buildContinueDraft / clearEventBundle のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/components/register/buildContinueDraft.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildContinueDraft,
  clearEventBundle,
} from "./buildContinueDraft.ts";
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
    worksSeriesName: "",
    title: "",
    characterName: "",
    purchasePrice: "",
    currencyCode: "",
    purchaseLocation: "",
    purchaseDate: "",
    memo: "",
    selectedSlots: new Set(),
    categoryTagId: null,
    storageLocationId: null,
    visualTags: [],
    unmatchedProductType: null,
    lookupCandidates: [],
    selectedCandidateIndex: null,
    rakutenProductUrl: "",
    rakutenItemCode: "",
    rakutenShopName: "",
    manualProductUrl: "",
    manualUrlLabel: "",
    registrationQuantity: "1",
    salesDesired: false,
    salesDesiredQuantity: "",
    wantObject: false,
    salesDesiredUserTouched: false,
    fieldSources: {
      product_name: "empty",
      purchase_price: "empty",
      character_name: "empty",
      product_group_name: "empty",
      memo: "empty",
      category_tag_id: "empty",
      color_tag_slots: "empty",
      purchase_location: "empty",
      rakuten_ref: "empty",
      manual_url: "empty",
    },
    ...partial,
  };
}

describe("buildContinueDraft", () => {
  it("keeps event bundle plus storage, category, color slots, and currency", () => {
    const prev = samplePrev({
      productName: "缶バッジA",
      barcode: "490123",
      memo: "メモ",
      purchasePrice: "1200",
      purchaseLocation: "会場",
      characterName: "キャラ",
      productGroupName: "グループ",
      worksSeriesName: "作品X",
      title: "タイトルY",
      purchaseDate: "2026-09-07",
      categoryTagId: 10,
      storageLocationId: 5,
      currencyCode: "USD",
      selectedSlots: new Set([1, 3]),
      visualTags: ["丸"],
      unmatchedProductType: "雑貨",
      registrationQuantity: "3",
      salesDesired: true,
      salesDesiredQuantity: "2",
      wantObject: true,
      rakutenProductUrl: "https://example.com/r",
      rakutenItemCode: "shop:1",
      rakutenShopName: "店",
      manualProductUrl: "https://example.com/m",
    });

    const next = buildContinueDraft(prev, {
      currencyCode: "JPY",
      defaultStorageLocationId: 99,
    });

    assert.equal(next.productName, "");
    assert.equal(next.barcode, "");
    assert.equal(next.memo, "");
    assert.equal(next.purchasePrice, "");
    assert.equal(next.purchaseLocation, "");
    assert.equal(next.productGroupName, "");
    assert.equal(next.title, "");
    assert.equal(next.file, null);
    assert.deepEqual(next.visualTags, []);
    assert.equal(next.unmatchedProductType, null);
    assert.equal(next.registrationQuantity, "1");
    assert.equal(next.salesDesired, false);
    assert.equal(next.wantObject, false);
    assert.equal(next.rakutenProductUrl, "");

    // イベント束
    assert.equal(next.worksSeriesName, "作品X");
    assert.equal(next.characterName, "キャラ");
    assert.equal(next.purchaseDate, "2026-09-07");
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
    assert.equal(next.worksSeriesName, "");
    assert.equal(next.characterName, "");
    assert.equal(next.purchaseDate, "");
  });
});

describe("clearEventBundle", () => {
  it("clears event and tag bundle; restores default currency and storage", () => {
    const prev = samplePrev({
      productName: "残す名前",
      worksSeriesName: "作品X",
      characterName: "キャラ",
      purchaseDate: "2026-09-07",
      categoryTagId: 10,
      storageLocationId: 5,
      selectedSlots: new Set([1, 2]),
      currencyCode: "USD",
      registrationQuantity: "2",
    });
    const next = clearEventBundle(prev, {
      currencyCode: "JPY",
      defaultStorageLocationId: 99,
    });
    assert.equal(next.productName, "残す名前");
    assert.equal(next.worksSeriesName, "");
    assert.equal(next.characterName, "");
    assert.equal(next.purchaseDate, "");
    assert.equal(next.categoryTagId, null);
    assert.equal(next.selectedSlots.size, 0);
    assert.equal(next.storageLocationId, 99);
    assert.equal(next.currencyCode, "JPY");
    assert.equal(next.registrationQuantity, "2");
  });

  it("leaves storage unset when no default", () => {
    const prev = samplePrev({ storageLocationId: 3 });
    const next = clearEventBundle(prev, {
      currencyCode: "EUR",
      defaultStorageLocationId: null,
    });
    assert.equal(next.storageLocationId, null);
    assert.equal(next.currencyCode, "EUR");
  });
});
