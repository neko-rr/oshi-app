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
  };
}

/**
 * 続けて登録用ドラフト。
 * 残す: イベント束（作品シリーズ・キャラ・購入日）＋収納・カテゴリ・カラータグ枠・通貨。
 * 消す: 製品名／グループ／タイトル／バーコード／写真／メモ／価格／購入場所／数量フラグ／URL／アシスト由来。
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
  next.worksSeriesName = prev.worksSeriesName;
  next.characterName = prev.characterName;
  next.purchaseDate = prev.purchaseDate;
  return next;
}

/**
 * 確認画面の「全部消す」。イベント束・タグ束をクリア（製品名など他フィールドは残す）。
 * 登録済みデータは触らない。
 */
export function clearEventBundle(
  prev: RegisterDraft,
  defaults: ContinueDraftDefaults,
): RegisterDraft {
  return {
    ...prev,
    worksSeriesName: "",
    characterName: "",
    purchaseDate: "",
    categoryTagId: null,
    selectedSlots: new Set(),
    storageLocationId: defaults.defaultStorageLocationId,
    currencyCode: defaults.currencyCode.trim() || "",
    fieldSources: {
      ...prev.fieldSources,
      character_name: "empty",
      category_tag_id: "empty",
      color_tag_slots: "empty",
    },
  };
}
