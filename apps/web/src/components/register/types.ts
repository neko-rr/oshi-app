import type { FieldSources } from "./assist/types";
import { emptyFieldSources } from "./assist/types";

export type WizardStep = "barcode" | "photo" | "confirm";

export type ColorTagItem = {
  slot: number;
  color_tag_name: string;
  color_tag_color: string;
};

export type CategoryTagItem = {
  category_tag_id: number;
  category_tag_name: string;
  category_tag_color?: string | null;
  category_tag_icon?: string | null;
};

export type StorageLocationItem = {
  storage_location_id: number;
  storage_location_name: string;
  storage_location_icon?: string | null;
  display_order?: number | null;
  register_pick_count?: number | null;
  last_register_picked_at?: string | null;
};

export type BarcodeLookupItem = {
  name?: string | null;
  catchcopy?: string | null;
  price?: number | null;
  product_url?: string | null;
  shop_name?: string | null;
  external_item_code?: string | null;
  image_url?: string | null;
  genre_id?: number | null;
};

export type BarcodeLookupResponse = {
  status?: string;
  items?: BarcodeLookupItem[];
  message?: string;
  suggested_category_name?: string | null;
};

export type RegisterDraft = {
  barcode: string;
  barcodeType: string | null;
  barcodeNote: string | null;
  suggestedName: string;
  suggestedPrice: string;
  file: File | null;
  productName: string;
  productGroupName: string;
  worksSeriesName: string;
  title: string;
  characterName: string;
  purchasePrice: string;
  /** ISO 4217。価格があるときの記録通貨 */
  currencyCode: string;
  purchaseLocation: string;
  purchaseDate: string;
  memo: string;
  selectedSlots: Set<number>;
  categoryTagId: number | null;
  storageLocationId: number | null;
  visualTags: string[];
  unmatchedProductType: string | null;
  /** 楽天照合候補（最大5） */
  lookupCandidates: BarcodeLookupItem[];
  selectedCandidateIndex: number | null;
  rakutenProductUrl: string;
  rakutenItemCode: string;
  rakutenShopName: string;
  /** メルカリ等の任意URL */
  manualProductUrl: string;
  manualUrlLabel: string;
  registrationQuantity: string;
  salesDesired: boolean;
  salesDesiredQuantity: string;
  wantObject: boolean;
  /** 交換OK欄をユーザーが触った */
  salesDesiredUserTouched: boolean;
  fieldSources: FieldSources;
};

export function emptyDraft(): RegisterDraft {
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
    fieldSources: emptyFieldSources(),
  };
}

export type { FieldSources, FieldSource } from "./assist/types";
