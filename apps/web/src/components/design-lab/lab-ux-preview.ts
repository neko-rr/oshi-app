/**
 * Design Lab 用の UX 補助プレビュー（親指ゾーン・文字サイズ・環境光）。
 * 専門家でなくても「届くか／読めるか／屋外で見えるか」を見るための近似。
 */

export type LabTextScaleId = "normal" | "large" | "xlarge";

export type LabAmbientId = "none" | "dim" | "outdoor";

export type LabTextScaleMeta = {
  id: LabTextScaleId;
  label: string;
  hint: string;
  /** プレビュー枠の font-size 倍率 */
  scale: number;
};

export type LabAmbientMeta = {
  id: LabAmbientId;
  label: string;
  hint: string;
  /** CSS filter 断片（色覚 filter と連結可） */
  cssFilter?: string;
};

export const LAB_TEXT_SCALES: readonly LabTextScaleMeta[] = [
  {
    id: "normal",
    label: "標準",
    hint: "通常の文字サイズ",
    scale: 1,
  },
  {
    id: "large",
    label: "大きめ",
    hint: "可読性チェック（約112%）",
    scale: 1.125,
  },
  {
    id: "xlarge",
    label: "さらに大",
    hint: "大きめ設定寄りの可読性（約125%）",
    scale: 1.25,
  },
] as const;

export const LAB_AMBIENTS: readonly LabAmbientMeta[] = [
  {
    id: "none",
    label: "室内",
    hint: "通常の輝度",
  },
  {
    id: "dim",
    label: "低輝度",
    hint: "暗い部屋・夜の体感近似",
    cssFilter: "brightness(0.52) contrast(1.08)",
  },
  {
    id: "outdoor",
    label: "屋外",
    hint: "日差しで洗われた見え方の近似",
    cssFilter: "brightness(1.28) contrast(0.88) saturate(0.92)",
  },
] as const;

/** 色覚 filter と環境光 filter を連結 */
export function labComposePreviewFilters(
  cvdFilter: string | undefined,
  ambientId: LabAmbientId,
): string | undefined {
  const ambient = LAB_AMBIENTS.find((a) => a.id === ambientId)?.cssFilter;
  const parts = [cvdFilter, ambient].filter(Boolean) as string[];
  return parts.length ? parts.join(" ") : undefined;
}
