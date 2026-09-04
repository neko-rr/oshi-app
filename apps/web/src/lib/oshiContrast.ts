/**
 * 推し色のコントラスト選定（WCAG AA 本文 4.5:1 目安）。
 * API `oshi_contrast.py` と同ルール。
 */

export const AA_NORMAL = 4.5;
export const FG_WHITE = "#ffffff";
export const FG_NEAR_BLACK = "#1a1614";
export const DEFAULT_MAIN_HEX = "#9f606c";
export const DEFAULT_SUB_HEX = "#6a9bb8";

const HEX_RE = /^#([0-9a-fA-F]{6})$/;

export type ResolvedOshiColors = {
  main_hex: string;
  sub_hex: string;
  main_foreground: string;
  soft_bg: string;
  soft_foreground: string;
};

export function normalizeHex(raw: string): string {
  let value = (raw || "").trim();
  if (!value.startsWith("#") && value.length === 6) {
    value = `#${value}`;
  }
  const m = HEX_RE.exec(value);
  if (!m) {
    throw new Error("色の形式が不正です（#RRGGBB）");
  }
  return `#${m[1].toLowerCase()}`;
}

function parseRgb(hexColor: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hexColor).slice(1);
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hexColor: string): number {
  const { r, g, b } = parseRgb(hexColor);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function mixHex(hexA: string, hexB: string, amount: number): string {
  const t = Math.max(0, Math.min(1, amount));
  const a = parseRgb(hexA);
  const b = parseRgb(hexB);
  return toHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  );
}

function fgCandidates(bgHex: string): string[] {
  const light = mixHex(bgHex, FG_WHITE, 0.45);
  const dark = mixHex(bgHex, FG_NEAR_BLACK, 0.55);
  const out: string[] = [];
  for (const c of [FG_WHITE, FG_NEAR_BLACK, light, dark]) {
    if (!out.includes(c)) out.push(c);
  }
  return out;
}

export function bestForeground(
  bgHex: string,
  minRatio: number = AA_NORMAL,
): string {
  const bg = normalizeHex(bgHex);
  const scored = fgCandidates(bg)
    .map((fg) => ({ fg, ratio: contrastRatio(fg, bg) }))
    .sort((a, b) => b.ratio - a.ratio);
  for (const { fg, ratio } of scored) {
    if (ratio >= minRatio) return fg;
  }
  throw new Error("この色では十分なコントラストの文字色を選べません");
}

export function softSurface(subHex: string): string {
  return mixHex(FG_WHITE, normalizeHex(subHex), 0.22);
}

export function resolveOshiColors(
  mainHex: string,
  subHex: string,
): ResolvedOshiColors {
  const main_hex = normalizeHex(mainHex);
  const sub_hex = normalizeHex(subHex);
  const soft_bg = softSurface(sub_hex);
  return {
    main_hex,
    sub_hex,
    main_foreground: bestForeground(main_hex),
    soft_bg,
    soft_foreground: bestForeground(soft_bg),
  };
}

/** キュレート済みスウォッチ（Lab ベース＋少し追加） */
export const OSHI_SWATCH_PRESETS = [
  { hex: "#9f606c", labelKey: "rose" },
  { hex: "#d4786a", labelKey: "coral" },
  { hex: "#6a9bb8", labelKey: "sky" },
  { hex: "#9a7eb8", labelKey: "lilac" },
  { hex: "#6a9f8e", labelKey: "mint" },
  { hex: "#c4a35a", labelKey: "gold" },
  { hex: "#e879a9", labelKey: "pink" },
  { hex: "#5b7c99", labelKey: "slate" },
] as const;

export type OshiSwatchLabelKey = (typeof OSHI_SWATCH_PRESETS)[number]["labelKey"];

export function tryResolveOshiColors(
  mainHex: string,
  subHex: string,
): ResolvedOshiColors | null {
  try {
    return resolveOshiColors(mainHex, subHex);
  } catch {
    return null;
  }
}
