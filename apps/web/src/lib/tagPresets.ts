/** プリセット slot の既定ラベル（API DEFAULT_* と同期） */
export const CATEGORY_PRESET_LABELS: Record<number, string> = {
  1: "アクリル",
  2: "缶バッジ",
  3: "フィギュア",
  4: "紙類",
  5: "ぬいぐるみ",
  6: "その他",
};

export const STORAGE_PRESET_LABELS: Record<number, string> = {
  1: "タンス",
  2: "棚",
  3: "ケース",
  4: "壁",
  5: "机",
  6: "その他",
};

export function isPresetSlot(slot: number | null | undefined): boolean {
  return typeof slot === "number" && slot >= 1 && slot <= 6;
}
