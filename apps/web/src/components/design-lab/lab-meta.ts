export type LabVariantId = "a" | "b" | "c";

/** Lab の端末プレビュー（Web PC / Web モバイル / ネイティブアプリ想定） */
export type LabPlatformId = "web-pc" | "web-mobile" | "mobile-app";

/** UI 状態見本（全案で共通切替） */
export type LabUiState =
  | "default"
  | "empty"
  | "loading"
  | "error"
  | "success";

export type LabVariantMeta = {
  id: LabVariantId;
  title: string;
  subtitle: string;
  ux_focus: string;
};

export type LabPlatformMeta = {
  id: LabPlatformId;
  label: string;
  hint: string;
};

export type LabOshiSwatch = {
  cssVar: string;
  hex: string;
  label: string;
};

export type LabUiStateMeta = {
  id: LabUiState;
  label: string;
};

/**
 * Design Lab 固定3軸。
 * 差の主戦場は配置・部品・UI/UX。色は全案で推し色あり（A も C と同系の色使い）。
 */
export const LAB_VARIANTS: readonly LabVariantMeta[] = [
  {
    id: "a",
    title: "A 用途最適",
    subtitle: "配置・密度・主CTAを最短に（色は C と同系＋推し色）",
    ux_focus:
      "登録・一覧・状態を最短。色はブランド種＋推し色アクセント。青一色など「色なし」にはしない。",
  },
  {
    id: "b",
    title: "B 推し活・遊び",
    subtitle: "写真主役・推し色の実感・やさしい動き",
    ux_focus:
      "楽しさを優先しつつ業務は残す。部品の大きさ・余白・動きで差を出す。",
  },
  {
    id: "c",
    title: "C ブランド整合",
    subtitle: "原則どおりの余白・階層・種色の置き方",
    ux_focus:
      "清潔で信頼感。推し色はボタン／フォーカス等のアクセントに限定。",
  },
] as const;

export const LAB_PLATFORMS: readonly LabPlatformMeta[] = [
  {
    id: "web-pc",
    label: "Web・PC",
    hint: "広い画面（ブラウザ）",
  },
  {
    id: "web-mobile",
    label: "Web・モバイル",
    hint: "スマホ幅のブラウザ",
  },
  {
    id: "mobile-app",
    label: "モバイルアプリ",
    hint: "Expo 想定（下タブ）",
  },
] as const;

export const LAB_UI_STATES: readonly LabUiStateMeta[] = [
  { id: "default", label: "通常" },
  { id: "empty", label: "空" },
  { id: "loading", label: "読込" },
  { id: "error", label: "エラー" },
  { id: "success", label: "成功" },
] as const;

/** 推し色サンプル（CSS 変数 + コントラスト用 hex） */
export const LAB_OSHI_SWATCHES: readonly LabOshiSwatch[] = [
  { cssVar: "--lab-swatch-rose", hex: "#9f606c", label: "ローズ" },
  { cssVar: "--lab-swatch-coral", hex: "#d4786a", label: "コーラル" },
  { cssVar: "--lab-swatch-sky", hex: "#6a9bb8", label: "スカイ" },
  { cssVar: "--lab-swatch-lilac", hex: "#9a7eb8", label: "ライラック" },
  { cssVar: "--lab-swatch-mint", hex: "#6a9f8e", label: "ミント" },
  { cssVar: "--lab-swatch-gold", hex: "#c4a35a", label: "ゴールド" },
] as const;

/** @deprecated LAB_OSHI_SWATCHES を使う */
export const LAB_OSHI_SWATCH_VARS = LAB_OSHI_SWATCHES.map((s) => s.cssVar);

export const LAB_ADOPTION_STORAGE_KEY = "oshiapp:design-lab:adoption";
