export type LabVariantId = "a" | "b" | "c";

/** Lab の端末プレビュー（Web PC / Web モバイル / ネイティブアプリ想定） */
export type LabPlatformId = "web-pc" | "web-mobile" | "mobile-app";

/** スマホ枠の向き（Web・モバイル／モバイルアプリのみ） */
export type LabPhoneOrientationId = "portrait" | "landscape";

/** 向きの表示モード。both = 縦と横を同時確認 */
export type LabPhoneOrientationMode = LabPhoneOrientationId | "both";

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

/** Lab で見比べる画面シーン */
export type LabSceneId =
  | "home"
  | "theme-settings"
  | "gallery"
  | "gallery-detail";

export type LabSceneMeta = {
  id: LabSceneId;
  label: string;
  hint: string;
};

export const LAB_SCENES: readonly LabSceneMeta[] = [
  {
    id: "home",
    label: "ホーム見本",
    hint: "一覧・登録導線の配置比較",
  },
  {
    id: "gallery",
    label: "ギャラリー",
    hint: "/gallery 一覧（検索・チップ・もっと見る）",
  },
  {
    id: "gallery-detail",
    label: "ギャラリー詳細",
    hint: "/gallery/[id] 写真主役と編集",
  },
  {
    id: "theme-settings",
    label: "色設定",
    hint: "/settings/theme の UX 比較（トークン一式）",
  },
] as const;

/**
 * Design Lab 固定3軸。
 * 差の主戦場は配置・部品・UI/UX。色は全案でテーマ色あり。
 */
export const LAB_VARIANTS: readonly LabVariantMeta[] = [
  {
    id: "a",
    title: "A 用途最適",
    subtitle: "配置・密度・主CTAを最短に（色は C と同系＋テーマ色）",
    ux_focus:
      "登録・一覧・状態を最短。テーマ色あり。青一色など「色なし」にはしない。",
  },
  {
    id: "b",
    title: "B 推し活・遊び",
    subtitle: "写真主役・テーマ色の実感・やさしい動き",
    ux_focus:
      "楽しさを優先しつつ業務は残す。部品の大きさ・余白・動きで差を出す。",
  },
  {
    id: "c",
    title: "C ブランド整合",
    subtitle: "原則どおりの余白・階層・色の置き方",
    ux_focus:
      "清潔で信頼感。セマンティック色と階層をはっきり。",
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

export type LabPhoneOrientationMeta = {
  id: LabPhoneOrientationMode;
  label: string;
  hint: string;
};

/** スマホ枠の向き切替（縦 / 横 / 同時） */
export const LAB_PHONE_ORIENTATION_MODES: readonly LabPhoneOrientationMeta[] = [
  {
    id: "portrait",
    label: "縦",
    hint: "縦持ち（一般的なスマホ）",
  },
  {
    id: "landscape",
    label: "横",
    hint: "横持ち（折り返し・横幅の確認）",
  },
  {
    id: "both",
    label: "縦+横",
    hint: "同じ案を縦と横で同時に見る",
  },
] as const;

/** 端末フレームの論理サイズ（chrome 除くおおよそのコンテンツ領域） */
export const LAB_PHONE_FRAME_SIZE: Record<
  LabPhoneOrientationId,
  { widthPx: number; contentMaxHeightPx: number }
> = {
  portrait: { widthPx: 390, contentMaxHeightPx: 640 },
  landscape: { widthPx: 640, contentMaxHeightPx: 360 },
};

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
