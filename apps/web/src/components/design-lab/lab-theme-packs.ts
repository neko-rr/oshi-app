/**
 * Lab / テーマ色スタジオ用の既存テーマパック一覧。
 * 本番 colors.css の近似。部品への hex 直書きには使わない。
 */

export type LabThemePack = {
  id: string;
  label: string;
  /** light = 枠黒 / dark = 枠白（明暗の見分け） */
  scheme: "light" | "dark";
  /** スウォッチ表示色 */
  swatch: string;
  bg: string;
  fg: string;
  muted: string;
  surface: string;
  border: string;
  primary: string;
  primaryFg: string;
};

/** todo-app / colors.css のテーマ ID に対応する見本（緑 default 先頭） */
export const LAB_THEME_PACKS: readonly LabThemePack[] = [
  {
    id: "default",
    label: "緑（既定）",
    scheme: "light",
    swatch: "#b8e05c",
    bg: "#f7f7f5",
    fg: "#2a2620",
    muted: "#6b6660",
    surface: "#ffffff",
    border: "#d4d0c8",
    primary: "#b8e05c",
    primaryFg: "#2a2620",
  },
  {
    id: "lime-right",
    label: "ライム",
    scheme: "light",
    swatch: "#a3e635",
    bg: "#f7f7f5",
    fg: "#2a2620",
    muted: "#6b6660",
    surface: "#ffffff",
    border: "#d4d0c8",
    primary: "#a3e635",
    primaryFg: "#2a2620",
  },
  {
    id: "lime-dark",
    label: "ライム（暗）",
    scheme: "dark",
    swatch: "#84cc16",
    bg: "#1a1f14",
    fg: "#f0f4e8",
    muted: "#a3b08a",
    surface: "#242b1c",
    border: "#3d4630",
    primary: "#84cc16",
    primaryFg: "#1a1f14",
  },
  {
    id: "emerald-dark",
    label: "エメラルド（暗）",
    scheme: "dark",
    swatch: "#34d399",
    bg: "#141f1c",
    fg: "#e8f5f0",
    muted: "#8aafa0",
    surface: "#1c2b26",
    border: "#2f433c",
    primary: "#34d399",
    primaryFg: "#141f1c",
  },
  {
    id: "sky-dark",
    label: "スカイ（暗）",
    scheme: "dark",
    swatch: "#38bdf8",
    bg: "#141a22",
    fg: "#e8f0f8",
    muted: "#8a9eb0",
    surface: "#1c2530",
    border: "#2f3d4d",
    primary: "#38bdf8",
    primaryFg: "#141a22",
  },
  {
    id: "blue-dark",
    label: "ブルー（暗）",
    scheme: "dark",
    swatch: "#3b82f6",
    bg: "#141822",
    fg: "#e8eef8",
    muted: "#8a96b0",
    surface: "#1c2230",
    border: "#2f384d",
    primary: "#3b82f6",
    primaryFg: "#ffffff",
  },
  {
    id: "pink-dark",
    label: "ピンク（暗）",
    scheme: "dark",
    swatch: "#f472b6",
    bg: "#1f141a",
    fg: "#f8e8f0",
    muted: "#b08a9e",
    surface: "#2b1c24",
    border: "#43303a",
    primary: "#f472b6",
    primaryFg: "#1f141a",
  },
  {
    id: "purple-dark",
    label: "パープル（暗）",
    scheme: "dark",
    swatch: "#a78bfa",
    bg: "#1a1422",
    fg: "#f0e8f8",
    muted: "#9e8ab0",
    surface: "#241c30",
    border: "#3a3048",
    primary: "#a78bfa",
    primaryFg: "#ffffff",
  },
  {
    id: "orange-dark",
    label: "オレンジ（暗）",
    scheme: "dark",
    swatch: "#fb923c",
    bg: "#1f1814",
    fg: "#f8f0e8",
    muted: "#b09a8a",
    surface: "#2b221c",
    border: "#433830",
    primary: "#fb923c",
    primaryFg: "#1f1814",
  },
  {
    id: "red-dark",
    label: "レッド（暗）",
    scheme: "dark",
    swatch: "#f87171",
    bg: "#1f1414",
    fg: "#f8e8e8",
    muted: "#b08a8a",
    surface: "#2b1c1c",
    border: "#433030",
    primary: "#f87171",
    primaryFg: "#ffffff",
  },
  {
    id: "yellow-dark",
    label: "イエロー（暗）",
    scheme: "dark",
    swatch: "#facc15",
    bg: "#1a1810",
    fg: "#f8f4e0",
    muted: "#b0a88a",
    surface: "#28241c",
    border: "#403a28",
    primary: "#facc15",
    primaryFg: "#1a1810",
  },
] as const;

export function findLabThemePack(id: string): LabThemePack | undefined {
  return LAB_THEME_PACKS.find((p) => p.id === id);
}

/** Lab 見本にテーマパックのセマンティック色を載せる（本番 CSS は触らない）。 */
export function labThemePackRootStyle(
  pack: LabThemePack,
): Record<string, string> {
  return {
    "--lab-bg": pack.bg,
    "--lab-fg": pack.fg,
    "--lab-muted": pack.muted,
    "--lab-surface": pack.surface,
    "--lab-border": pack.border,
    "--lab-primary": pack.primary,
    "--lab-primary-fg": pack.primaryFg,
    "--lab-accent-soft": `color-mix(in oklab, ${pack.primary} 16%, ${pack.surface})`,
    "--lab-ring": pack.primary,
    background: pack.bg,
    color: pack.fg,
  };
}
