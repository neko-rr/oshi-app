/**
 * applyBarcodeCandidate の自己テスト。
 * 実行: npx tsx apps/web/src/components/register/assist/applyBarcodeCandidate.selftest.ts
 */
import assert from "node:assert/strict";
import { applyBarcodeCandidateToDraft } from "./applyBarcodeCandidate";
import { emptyDraft } from "../types";

const item = {
  name: "缶バッジ",
  price: 500,
  product_url: "https://item.example/aff",
  shop_name: "推しショップ",
  external_item_code: "shop:1234",
  image_url: "https://img.example/m.jpg",
};

{
  const draft = emptyDraft();
  const next = applyBarcodeCandidateToDraft(item, draft, 0);
  assert.equal(next.productName, "缶バッジ");
  assert.equal(next.purchasePrice, "500");
  assert.equal(next.purchaseLocation, "推しショップ");
  assert.equal(next.rakutenProductUrl, "https://item.example/aff");
  assert.equal(next.rakutenItemCode, "shop:1234");
  assert.equal(next.fieldSources.product_name, "barcode");
  assert.equal(next.fieldSources.rakuten_ref, "barcode");
}

{
  const draft = emptyDraft();
  draft.productName = "手入力";
  draft.fieldSources.product_name = "user";
  const next = applyBarcodeCandidateToDraft(item, draft, 1);
  assert.equal(next.productName, "手入力");
  assert.equal(next.rakutenShopName, "推しショップ");
  assert.equal(next.selectedCandidateIndex, 1);
}

console.log("applyBarcodeCandidate.selftest: ok");
