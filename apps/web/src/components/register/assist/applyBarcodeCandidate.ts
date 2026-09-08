/** 楽天候補1件を登録ドラフトへ適用（user 出典は上書きしない） */

import type { FieldSources } from "./types";
import type { BarcodeLookupItem, RegisterDraft } from "../types";

export type ApplyBarcodeCandidateResult = {
  draft: Pick<
    RegisterDraft,
    | "productName"
    | "purchasePrice"
    | "purchaseLocation"
    | "suggestedName"
    | "suggestedPrice"
    | "rakutenProductUrl"
    | "rakutenItemCode"
    | "rakutenShopName"
    | "selectedCandidateIndex"
    | "fieldSources"
  >;
};

function canOverwrite(source: FieldSources[keyof FieldSources]): boolean {
  return source === "empty" || source === "vision" || source === "barcode";
}

export function applyBarcodeCandidateToDraft(
  item: BarcodeLookupItem,
  prev: RegisterDraft,
  index: number,
): ApplyBarcodeCandidateResult["draft"] {
  const sources = { ...prev.fieldSources };
  const name = item.name?.trim() ?? "";
  const price =
    item.price != null && Number.isFinite(Number(item.price))
      ? String(item.price)
      : "";
  const shop = item.shop_name?.trim() ?? "";
  const url = item.product_url?.trim() ?? "";
  const code = item.external_item_code?.trim() ?? "";

  let productName = prev.productName;
  if (name && prev.fieldSources.product_name !== "user") {
    productName = name;
    sources.product_name = "barcode";
  }

  let purchasePrice = prev.purchasePrice;
  if (price && prev.fieldSources.purchase_price !== "user") {
    purchasePrice = price;
    sources.purchase_price = "barcode";
  }

  let purchaseLocation = prev.purchaseLocation;
  if (shop && canOverwrite(prev.fieldSources.purchase_location)) {
    purchaseLocation = shop;
    sources.purchase_location = "barcode";
  }

  let rakutenProductUrl = prev.rakutenProductUrl;
  if (url && canOverwrite(prev.fieldSources.rakuten_ref)) {
    rakutenProductUrl = url;
    sources.rakuten_ref = "barcode";
  } else if (!url && prev.fieldSources.rakuten_ref !== "user") {
    rakutenProductUrl = "";
  }

  let rakutenItemCode = prev.rakutenItemCode;
  let rakutenShopName = prev.rakutenShopName;
  if (prev.fieldSources.rakuten_ref !== "user") {
    rakutenItemCode = code;
    rakutenShopName = shop;
    if (url || code || shop) {
      sources.rakuten_ref = "barcode";
    }
  }

  return {
    productName,
    purchasePrice,
    purchaseLocation,
    suggestedName: name,
    suggestedPrice: price,
    rakutenProductUrl,
    rakutenItemCode,
    rakutenShopName,
    selectedCandidateIndex: index,
    fieldSources: sources,
  };
}
