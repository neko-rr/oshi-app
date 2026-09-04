/** プリセット slot の ID（表示名は messages の TagPresets）。API DEFAULT_* と同期 */
export function isPresetSlot(slot: number | null | undefined): boolean {
  return typeof slot === "number" && slot >= 1 && slot <= 6;
}

export const PRESET_SLOTS = [1, 2, 3, 4, 5, 6] as const;
