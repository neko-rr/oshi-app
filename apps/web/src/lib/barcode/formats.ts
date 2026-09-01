/** 推し活グッズでよく使う 1D / QR。BarcodeDetector / ZXing 共通の候補 */
export const BARCODE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "qr_code",
] as const;

export type BarcodeFormatName = (typeof BARCODE_FORMATS)[number];

export type DecodedBarcode = {
  raw_value: string;
  format: string | null;
};
