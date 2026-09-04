/** ギャラリー選択モードの UI 契約（一括 API 上限と揃える）。 */

export const GALLERY_BULK_MAX = 100;

export type GallerySelectionViewState = {
  selectionMode: boolean;
  selectedIds: ReadonlySet<number>;
  /** true のときグリッドは選択中だけ表示 */
  showSelectedOnly: boolean;
};

export function createEmptySelectionViewState(): GallerySelectionViewState {
  return {
    selectionMode: false,
    selectedIds: new Set(),
    showSelectedOnly: false,
  };
}

export function exitSelectionViewState(): GallerySelectionViewState {
  return createEmptySelectionViewState();
}

/** 一覧に載っている ID を選択にマージ（このページ全選択）。 */
export function withPageSelected(
  selected: ReadonlySet<number>,
  pageIds: readonly number[],
): Set<number> {
  const next = new Set(selected);
  for (const id of pageIds) {
    if (id >= 1) next.add(id);
  }
  return next;
}

/** ページ内がすべて選択済みか。 */
export function isPageFullySelected(
  selected: ReadonlySet<number>,
  pageIds: readonly number[],
): boolean {
  if (pageIds.length === 0) return false;
  return pageIds.every((id) => selected.has(id));
}

/**
 * 絞り込み結果などから得た ID で選択を置き換え。
 * API 上限を超える分は落とす（先頭から）。
 */
export function selectionFromIds(
  ids: readonly number[],
  max = GALLERY_BULK_MAX,
): { selectedIds: Set<number>; truncated: boolean } {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const raw of ids) {
    const id = Math.floor(Number(raw));
    if (!Number.isFinite(id) || id < 1 || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= max) {
      return {
        selectedIds: new Set(out),
        truncated: ids.length > out.length || seen.size > max,
      };
    }
  }
  // 入力が max ちょうどで打ち切ったか、呼び出し側の has_more は別判定
  return { selectedIds: new Set(out), truncated: false };
}

export function filterItemsBySelection<
  T extends { registered_product_id: number },
>(
  items: readonly T[],
  selectedIds: ReadonlySet<number>,
  showSelectedOnly: boolean,
): T[] {
  if (!showSelectedOnly) return [...items];
  return items.filter((item) => selectedIds.has(item.registered_product_id));
}
