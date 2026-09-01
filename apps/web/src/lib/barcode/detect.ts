import { BARCODE_FORMATS, type DecodedBarcode } from "./formats";

type BarcodeDetectorLike = {
  detect: (
    source: ImageBitmapSource,
  ) => Promise<Array<{ rawValue?: string; format?: string }>>;
};

type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    BarcodeDetector?: BarcodeDetectorCtor;
  };
  return w.BarcodeDetector ?? null;
}

export function isNativeBarcodeDetectorAvailable(): boolean {
  return getBarcodeDetectorCtor() != null;
}

/** Chromium 等: ネイティブ BarcodeDetector で 1 フレーム検出 */
export async function detectWithNative(
  source: ImageBitmapSource,
): Promise<DecodedBarcode | null> {
  const Ctor = getBarcodeDetectorCtor();
  if (!Ctor) return null;
  try {
    const detector = new Ctor({ formats: [...BARCODE_FORMATS] });
    const results = await detector.detect(source);
    const first = results.find((r) => r.rawValue && String(r.rawValue).trim());
    if (!first?.rawValue) return null;
    return {
      raw_value: String(first.rawValue).trim(),
      format: first.format ? String(first.format) : null,
    };
  } catch {
    return null;
  }
}

function videoToCanvas(video: HTMLVideoElement): HTMLCanvasElement | null {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}

/** Safari 等: ZXing（同期 decodeFromCanvas） */
export async function detectWithZxingFromVideo(
  video: HTMLVideoElement,
): Promise<DecodedBarcode | null> {
  const canvas = videoToCanvas(video);
  if (!canvas) return null;
  try {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    const result = reader.decodeFromCanvas(canvas);
    const text = result.getText()?.trim();
    if (!text) return null;
    return {
      raw_value: text,
      format: result.getBarcodeFormat()?.toString() ?? null,
    };
  } catch {
    return null;
  }
}

export async function detectWithZxingFromImage(
  img: HTMLImageElement,
): Promise<DecodedBarcode | null> {
  try {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    const result = await reader.decodeFromImageElement(img);
    const text = result.getText()?.trim();
    if (!text) return null;
    return {
      raw_value: text,
      format: result.getBarcodeFormat()?.toString() ?? null,
    };
  } catch {
    return null;
  }
}

/** 動画フレームから検出（ネイティブ優先 → ZXing） */
export async function detectFromVideoFrame(
  video: HTMLVideoElement,
): Promise<DecodedBarcode | null> {
  if (video.readyState < 2) return null;
  const native = await detectWithNative(video);
  if (native) return native;
  return detectWithZxingFromVideo(video);
}

/** 画像ファイルから検出（アップロード経路） */
export async function detectFromImageFile(
  file: File,
): Promise<DecodedBarcode | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const native = await detectWithNative(img);
    if (native) return native;
    return detectWithZxingFromImage(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像を読み込めませんでした"));
    img.src = src;
  });
}
