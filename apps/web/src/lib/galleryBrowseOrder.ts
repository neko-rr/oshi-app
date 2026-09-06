/**
 * 一覧→詳細の並びを sessionStorage に保持し、隣製品を解決する。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/galleryBrowseOrder.test.ts
 */

export const GALLERY_BROWSE_ORDER_KEY = "oshiapp:galleryBrowseOrder";

export type GalleryBrowseOrder = {
  ids: number[];
};

export function neighborsForId(
  ids: readonly number[],
  currentId: number,
): { prev_id: number | null; next_id: number | null } {
  const index = ids.indexOf(currentId);
  if (index < 0) {
    return { prev_id: null, next_id: null };
  }
  return {
    prev_id: index > 0 ? ids[index - 1]! : null,
    next_id: index < ids.length - 1 ? ids[index + 1]! : null,
  };
}

export function sanitizeBrowseOrderIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  const seen = new Set<number>();
  for (const item of raw) {
    const n = typeof item === "number" ? item : Number(item);
    if (!Number.isInteger(n) || n < 1 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export function readGalleryBrowseOrder(): number[] {
  try {
    if (typeof sessionStorage === "undefined") return [];
    const raw = sessionStorage.getItem(GALLERY_BROWSE_ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { ids?: unknown };
    return sanitizeBrowseOrderIds(parsed?.ids);
  } catch {
    return [];
  }
}

export function writeGalleryBrowseOrder(ids: readonly number[]): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    const clean = sanitizeBrowseOrderIds([...ids]);
    if (clean.length === 0) {
      sessionStorage.removeItem(GALLERY_BROWSE_ORDER_KEY);
      return;
    }
    const payload: GalleryBrowseOrder = { ids: clean };
    sessionStorage.setItem(GALLERY_BROWSE_ORDER_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/** 既存の並びの後ろにまだ無い ID を足す（もっと見る用）。 */
export function appendGalleryBrowseOrder(ids: readonly number[]): void {
  const prev = readGalleryBrowseOrder();
  const seen = new Set(prev);
  const next = [...prev];
  for (const id of sanitizeBrowseOrderIds([...ids])) {
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  writeGalleryBrowseOrder(next);
}
