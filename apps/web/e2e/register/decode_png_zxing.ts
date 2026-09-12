/**
 * L1 デコード契約: ZXing（@zxing/library）で PNG を読む。
 * ブラウザの BarcodeDetector は使わない（CI の決定的パス）。
 */

import zxing from "@zxing/library";
import { readPngRgba } from "./read_png_rgba.ts";

const {
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
  BarcodeFormat,
} = zxing;

export function decodePngWithZxing(pngBytes: Buffer): string {
  if (!pngBytes?.length) {
    throw new Error("PNG が空です");
  }
  const { width, height, data } = readPngRgba(pngBytes);
  if (width < 8 || height < 8) {
    throw new Error("PNG が小さすぎます");
  }
  const luminances = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    const r = data[o] ?? 0;
    const g = data[o + 1] ?? 0;
    const b = data[o + 2] ?? 0;
    luminances[i] = (r * 299 + g * 587 + b * 114) / 1000;
  }
  const source = new RGBLuminanceSource(luminances, width, height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const reader = new MultiFormatReader();
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_128,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  reader.setHints(hints);
  try {
    const result = reader.decode(bitmap);
    const text = result.getText()?.trim();
    if (!text) {
      throw new Error("ZXing が空文字を返しました");
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("ZXing")) {
      throw err;
    }
    throw new Error("ZXing がバーコードを読めませんでした");
  }
}
