/**
 * ギャラリー写真フィット。large は常に contain。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/galleryImageFit.test.ts
 */

export type GalleryImageFitId = "cover" | "contain";
export type GalleryLayoutForFit = "grid" | "large" | "list";

/** カード img に渡す object-fit。大きめレイアウトは常に contain。 */
export function resolveGalleryObjectFit(
  layout: GalleryLayoutForFit,
  fit: GalleryImageFitId,
): GalleryImageFitId {
  if (layout === "large") return "contain";
  return fit === "contain" ? "contain" : "cover";
}
