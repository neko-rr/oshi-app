import type { RegisterDraft } from "./types";

export type ContinueDraftDefaults = {
  currencyCode: string;
  /** 設定のいつも選ぶ収納。prev に収納が無いときだけ使う */
  defaultStorageLocationId: number | null;
};

function blankDraft(): RegisterDraft {
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
  };
}

/**
 * 続けて登録用ドラフト。
 * 残す: 収納・カテゴリ・カラータグ枠・通貨。
 * 消す: 名前／バーコード／写真／メモ／価格／キャラ／グループ／アシスト由来。
 */
export function buildContinueDraft(
  prev: RegisterDraft,
  defaults: ContinueDraftDefaults,
): RegisterDraft {
  const next = blankDraft();
  next.currencyCode =
    prev.currencyCode.trim() || defaults.currencyCode.trim() || "";
  next.categoryTagId = prev.categoryTagId;
  next.selectedSlots = new Set(prev.selectedSlots);
  next.storageLocationId =
    prev.storageLocationId ?? defaults.defaultStorageLocationId;
  return next;
}
