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

export type BarcodeLookupResponse = {
  status?: string;
  items?: Array<{ name?: string | null; price?: number | null }>;
  message?: string;
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
  characterName: string;
  purchasePrice: string;
  /** ISO 4217。価格があるときの記録通貨 */
  currencyCode: string;
  memo: string;
  selectedSlots: Set<number>;
  categoryTagId: number | null;
  storageLocationId: number | null;
  visualTags: string[];
  unmatchedProductType: string | null;
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
    characterName: "",
    purchasePrice: "",
    currencyCode: "",
    memo: "",
    selectedSlots: new Set(),
    categoryTagId: null,
    storageLocationId: null,
    visualTags: [],
    unmatchedProductType: null,
    fieldSources: emptyFieldSources(),
  };
}

export type { FieldSources, FieldSource } from "./assist/types";
