export type WizardStep = "barcode" | "photo" | "confirm";

export type ColorTagItem = {
  slot: number;
  color_tag_name: string;
  color_tag_color: string;
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
  memo: string;
  selectedSlots: Set<number>;
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
    memo: "",
    selectedSlots: new Set(),
  };
}
