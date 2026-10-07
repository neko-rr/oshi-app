/**
 * 登録用写真のクライアント圧縮。
 * Free: 長辺 2048・目標 ~2.5MB・API 上限 10MB 未満。
 * 有料差は「長辺／容量」であり「2MB vs 3MB」ではない（docs/product/photo_storage.md）。
 */

/** 無料ティアの長辺上限（px）— 見た目の主因 */
export const FREE_PHOTO_MAX_EDGE = 2048;

/** 目標バイト（副次。これを超えないよう品質を下げる） */
export const FREE_PHOTO_TARGET_BYTES = Math.floor(2.5 * 1024 * 1024);

/** API `photos` のハード上限と揃える */
export const PHOTO_UPLOAD_HARD_MAX_BYTES = 10 * 1024 * 1024;

const JPEG_QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45] as const;

/** メンバーの写真プラン。有料購読が付くまで実質 free のみ。 */
export type PhotoPlanId = "free" | "standard" | "high";

export type PhotoQualityTier = {
  id: PhotoPlanId;
  /** ユーザー向け差の本丸 */
  max_edge: number;
  /** エンコード目標（訴求しない） */
  target_bytes: number;
};

/**
 * 画質ティア。差は max_edge。target_bytes は副次。
 * 有料配線前は resolvePhotoQualityTier が常に free を返す運用でも定数は残す。
 */
export const PHOTO_QUALITY_TIERS: Record<PhotoPlanId, PhotoQualityTier> = {
  free: {
    id: "free",
    max_edge: FREE_PHOTO_MAX_EDGE,
    target_bytes: FREE_PHOTO_TARGET_BYTES,
  },
  standard: {
    id: "standard",
    max_edge: 3072,
    target_bytes: Math.floor(6 * 1024 * 1024),
  },
  high: {
    id: "high",
    max_edge: 4096,
    target_bytes: Math.floor(10 * 1024 * 1024),
  },
};

/**
 * ユーザーあたり Storage ソフトクォータ案（バイト）。未強制。
 * 有料訴求は「保存できる量」。価格決定時に見直す。
 */
export const PHOTO_STORAGE_QUOTA_BYTES: Record<PhotoPlanId, number> = {
  free: 200 * 1024 * 1024,
  standard: 5 * 1024 * 1024 * 1024,
  high: 20 * 1024 * 1024 * 1024,
};

/**
 * プラン → 圧縮ティア。
 * 未知・未契約は free。有料実装後もここを唯一の入口にする。
 */
export function resolvePhotoQualityTier(
  plan: PhotoPlanId | string | null | undefined,
): PhotoQualityTier {
  if (plan === "standard" || plan === "high") {
    return PHOTO_QUALITY_TIERS[plan];
  }
  return PHOTO_QUALITY_TIERS.free;
}

export function resolvePhotoStorageQuotaBytes(
  plan: PhotoPlanId | string | null | undefined,
): number {
  if (plan === "standard" || plan === "high") {
    return PHOTO_STORAGE_QUOTA_BYTES[plan];
  }
  return PHOTO_STORAGE_QUOTA_BYTES.free;
}

/** 有料ティアは無料より長辺が大きい（MB 差だけのティアを禁止） */
export function paidTiersRaiseMaxEdge(): boolean {
  const free = PHOTO_QUALITY_TIERS.free.max_edge;
  return (
    PHOTO_QUALITY_TIERS.standard.max_edge > free &&
    PHOTO_QUALITY_TIERS.high.max_edge > PHOTO_QUALITY_TIERS.standard.max_edge
  );
}

export type RotateDegrees = 90 | -90 | 180;

export function normalizeRotateDegrees(degrees: number): 0 | 90 | 180 | 270 {
  const d = ((Math.round(degrees) % 360) + 360) % 360;
  if (d === 90 || d === 180 || d === 270) return d;
  return 0;
}

export function canvasSizeAfterRotate(
  width: number,
  height: number,
  degrees: number,
): { width: number; height: number } {
  const d = normalizeRotateDegrees(degrees);
  if (d === 90 || d === 270) {
    return { width: height, height: width };
  }
  return { width, height };
}

type Canvas2d = {
  translate: (x: number, y: number) => void;
  rotate: (rad: number) => void;
};

/** canvas サイズ確定後、drawImage 前に呼ぶ */
export function applyRotateTransform(
  ctx: Canvas2d,
  degrees: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const d = normalizeRotateDegrees(degrees);
  if (d === 90) {
    ctx.translate(canvasWidth, 0);
    ctx.rotate(Math.PI / 2);
  } else if (d === 180) {
    ctx.translate(canvasWidth, canvasHeight);
    ctx.rotate(Math.PI);
  } else if (d === 270) {
    ctx.translate(0, canvasHeight);
    ctx.rotate(-Math.PI / 2);
  }
}

async function createOrientedBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

export function scaleToMaxEdge(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error("invalid_dimensions");
  }
  if (width < 1 || height < 1) {
    throw new Error("invalid_dimensions");
  }
  const edge = Math.max(width, height);
  if (edge <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / edge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** すでに十分小さければ再エンコードを省略できるか */
export function canSkipReencode(
  file: Pick<File, "size" | "type">,
  width: number,
  height: number,
  tier: PhotoQualityTier,
): boolean {
  const edge = Math.max(width, height);
  if (edge > tier.max_edge) return false;
  if (file.size > tier.target_bytes) return false;
  if (file.size > PHOTO_UPLOAD_HARD_MAX_BYTES) return false;
  const type = (file.type || "").toLowerCase();
  return type === "image/jpeg" || type === "image/jpg" || type === "image/webp";
}

export type PrepareRegisterPhotoResult =
  | { ok: true; file: File; compressed: boolean }
  | { ok: false; code: "unsupported" | "too_large" | "encode_failed" };

type PrepareOptions = {
  /** 省略時は無料ティア（resolvePhotoQualityTier(null)） */
  tier?: PhotoQualityTier;
  /** プラン指定（tier より優先しない。tier 未指定時に解決） */
  plan?: PhotoPlanId | string | null;
  /** 画素を時計回りに回す（EXIF 適用後） */
  rotateDegrees?: number;
  createBitmap?: (file: File) => Promise<ImageBitmap>;
  canvasFactory?: () => HTMLCanvasElement;
};

async function encodeJpegFromCanvas(
  canvas: HTMLCanvasElement,
  targetBytes: number,
): Promise<Blob | null> {
  let blob: Blob | null = null;
  for (const q of JPEG_QUALITY_STEPS) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", q);
    });
    if (blob && blob.size <= targetBytes) break;
  }
  return blob;
}

function fileFromJpegBlob(sourceName: string, blob: Blob): File {
  const baseName = sourceName.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * 登録・Vision 用に JPEG へ整える。
 * EXIF の向きは createImageBitmap(from-image) で画素に焼き、スキップ再エンコードしない。
 */
export async function prepareRegisterPhoto(
  file: File,
  options: PrepareOptions = {},
): Promise<PrepareRegisterPhotoResult> {
  if (!file || file.size <= 0) {
    return { ok: false, code: "unsupported" };
  }

  const tier =
    options.tier ?? resolvePhotoQualityTier(options.plan ?? null);
  const createBitmap = options.createBitmap ?? createOrientedBitmap;
  const canvasFactory =
    options.canvasFactory ?? (() => document.createElement("canvas"));
  const rotate = normalizeRotateDegrees(options.rotateDegrees ?? 0);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createBitmap(file);
  } catch {
    if (file.size <= PHOTO_UPLOAD_HARD_MAX_BYTES) {
      return { ok: true, file, compressed: false };
    }
    return { ok: false, code: "unsupported" };
  }

  try {
    const scaled = scaleToMaxEdge(
      bitmap.width,
      bitmap.height,
      tier.max_edge,
    );
    const canvasSize = canvasSizeAfterRotate(
      scaled.width,
      scaled.height,
      rotate,
    );

    const canvas = canvasFactory();
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file.size <= PHOTO_UPLOAD_HARD_MAX_BYTES
        ? { ok: true, file, compressed: false }
        : { ok: false, code: "encode_failed" };
    }
    applyRotateTransform(ctx, rotate, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, scaled.width, scaled.height);

    const blob = await encodeJpegFromCanvas(canvas, tier.target_bytes);
    if (!blob) {
      return file.size <= PHOTO_UPLOAD_HARD_MAX_BYTES
        ? { ok: true, file, compressed: false }
        : { ok: false, code: "encode_failed" };
    }
    if (blob.size > PHOTO_UPLOAD_HARD_MAX_BYTES) {
      return { ok: false, code: "too_large" };
    }
    return {
      ok: true,
      file: fileFromJpegBlob(file.name, blob),
      compressed: true,
    };
  } finally {
    bitmap.close();
  }
}

/** プレビュー上の左／右 90 度回転（画素を回して再エンコード） */
export async function rotateRegisterPhoto(
  file: File,
  degrees: RotateDegrees,
  options: Omit<PrepareOptions, "rotateDegrees"> = {},
): Promise<PrepareRegisterPhotoResult> {
  return prepareRegisterPhoto(file, { ...options, rotateDegrees: degrees });
}
