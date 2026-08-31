/**
 * Design Lab 用の色覚多様性（CVD）シミュレーション。
 * 行列は Machado 系の近似（Chrome DevTools と同系統）。臨床診断ではない。
 * 参照: https://developer.chrome.com/docs/chromium/cvd
 */

export type LabCvdModeId =
  | "none"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "achromatopsia";

export type LabCvdModeMeta = {
  id: LabCvdModeId;
  label: string;
  hint: string;
};

/** SVG filter の id（ページ内衝突を避ける） */
export const LAB_CVD_FILTER_IDS: Record<
  Exclude<LabCvdModeId, "none">,
  string
> = {
  protanopia: "lab-cvd-protanopia",
  deuteranopia: "lab-cvd-deuteranopia",
  tritanopia: "lab-cvd-tritanopia",
  achromatopsia: "lab-cvd-achromatopsia",
};

/**
 * feColorMatrix values（行: R′ G′ B′ A′）。
 * deuteranopia は Chrome ドキュメント掲載値。他は同系統の Machado 近似。
 */
export const LAB_CVD_MATRICES: Record<
  Exclude<LabCvdModeId, "none">,
  string
> = {
  protanopia: [
    "0.152286 1.052583 -0.204868 0 0",
    "0.114503 0.786281 0.099216 0 0",
    "-0.003882 -0.048116 1.051998 0 0",
    "0 0 0 1 0",
  ].join(" "),
  deuteranopia: [
    "0.367 0.861 -0.228 0 0",
    "0.280 0.673 0.047 0 0",
    "-0.012 0.043 0.969 0 0",
    "0 0 0 1 0",
  ].join(" "),
  tritanopia: [
    "1.255528 -0.076749 -0.178779 0 0",
    "-0.078411 0.930809 0.147602 0 0",
    "0.004733 0.691367 0.3039 0 0",
    "0 0 0 1 0",
  ].join(" "),
  achromatopsia: [
    "0.2126 0.7152 0.0722 0 0",
    "0.2126 0.7152 0.0722 0 0",
    "0.2126 0.7152 0.0722 0 0",
    "0 0 0 1 0",
  ].join(" "),
};

export const LAB_CVD_MODES: readonly LabCvdModeMeta[] = [
  { id: "none", label: "なし", hint: "通常の見え方" },
  {
    id: "protanopia",
    label: "1型（プロタン）",
    hint: "赤の感度が弱い／ない近似",
  },
  {
    id: "deuteranopia",
    label: "2型（デュータン）",
    hint: "緑の感度が弱い／ない近似（多い）",
  },
  {
    id: "tritanopia",
    label: "3型（トリタン）",
    hint: "青の感度が弱い／ない近似",
  },
  {
    id: "achromatopsia",
    label: "全色盲",
    hint: "色のないグレースケール近似",
  },
] as const;

/** CSS filter 値。none のときは undefined */
export function labCvdFilterCss(
  mode: LabCvdModeId,
): string | undefined {
  if (mode === "none") return undefined;
  return `url(#${LAB_CVD_FILTER_IDS[mode]})`;
}
