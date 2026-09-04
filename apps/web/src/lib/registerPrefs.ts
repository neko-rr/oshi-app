/** 登録ウィザード向け収納の並び（設定の display_order は設定画面の正）。 */

export type StorageLocationForRegister = {
  storage_location_id: number;
  display_order?: number | null;
  register_pick_count?: number | null;
  last_register_picked_at?: string | null;
};

function pickTimeMs(raw: string | null | undefined): number {
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

/**
 * いつも選ぶ収納があれば先頭に固定。なければ登録回数・最終使用で並べ替え。
 * 自動選択は呼び出し側（defaultId があるときだけ）で行う。
 */
export function orderStorageLocationsForRegister<
  T extends StorageLocationForRegister,
>(items: readonly T[], defaultId: number | null): T[] {
  if (!items.length) return [];
  const list = [...items];

  if (defaultId != null && defaultId >= 1) {
    const pinned = list.filter((x) => x.storage_location_id === defaultId);
    const rest = list
      .filter((x) => x.storage_location_id !== defaultId)
      .sort(
        (a, b) =>
          (a.display_order ?? 0) - (b.display_order ?? 0) ||
          a.storage_location_id - b.storage_location_id,
      );
    return [...pinned, ...rest];
  }

  return list.sort((a, b) => {
    const timeDiff =
      pickTimeMs(b.last_register_picked_at) -
      pickTimeMs(a.last_register_picked_at);
    if (timeDiff !== 0) return timeDiff;
    const countDiff =
      (b.register_pick_count ?? 0) - (a.register_pick_count ?? 0);
    if (countDiff !== 0) return countDiff;
    return (
      (a.display_order ?? 0) - (b.display_order ?? 0) ||
      a.storage_location_id - b.storage_location_id
    );
  });
}
