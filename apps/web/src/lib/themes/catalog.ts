/**
 * テーマカタログ（todo-app / colors.css の data-theme と対応）。
 * スウォッチ表示用の色のみここに置く（画面部品への hex 直書きはしない）。
 */
export type ThemeScheme = "light" | "dark";

export type ThemeOption = {
  id: string;
  label: string;
  scheme: ThemeScheme;
  /** 丸スウォッチの塗り（カタログ専用） */
  swatch: string;
};

export const DEFAULT_THEME_ID = "default";

export const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    id: "default",
    label: "緑（既定）",
    scheme: "light",
    swatch: "#b8e05c",
  },
  {
    id: "lime-right",
    label: "ライム",
    scheme: "light",
    swatch: "#a3e635",
  },
  {
    id: "lime-dark",
    label: "ライム（暗）",
    scheme: "dark",
    swatch: "#84cc16",
  },
  {
    id: "emerald-dark",
    label: "エメラルド（暗）",
    scheme: "dark",
    swatch: "#34d399",
  },
  {
    id: "sky-dark",
    label: "スカイ（暗）",
    scheme: "dark",
    swatch: "#38bdf8",
  },
  {
    id: "blue-dark",
    label: "ブルー（暗）",
    scheme: "dark",
    swatch: "#3b82f6",
  },
  {
    id: "pink-dark",
    label: "ピンク（暗）",
    scheme: "dark",
    swatch: "#f472b6",
  },
  {
    id: "purple-dark",
    label: "パープル（暗）",
    scheme: "dark",
    swatch: "#a78bfa",
  },
  {
    id: "orange-dark",
    label: "オレンジ（暗）",
    scheme: "dark",
    swatch: "#fb923c",
  },
  {
    id: "red-dark",
    label: "レッド（暗）",
    scheme: "dark",
    swatch: "#f87171",
  },
  {
    id: "yellow-dark",
    label: "イエロー（暗）",
    scheme: "dark",
    swatch: "#facc15",
  },
] as const;

export const THEME_IDS = THEME_OPTIONS.map((t) => t.id);

/** ライト＝黒枠 / ダーク＝白枠 */
export function themeSwatchRimClass(scheme: ThemeScheme): string {
  return scheme === "dark" ? "border-white" : "border-zinc-900";
}

export function findThemeOption(id: string): ThemeOption {
  return (
    THEME_OPTIONS.find((t) => t.id === id) ??
    THEME_OPTIONS.find((t) => t.id === DEFAULT_THEME_ID)!
  );
}
