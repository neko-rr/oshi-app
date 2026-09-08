/**
 * Design Lab 用: シード色から Tailwind 風 50–950 スケールと
 * セマンティック見本パックを作る（本番 colors.css には自動反映しない）。
 */
import {
  bestForeground,
  contrastRatio,
  mixHex,
  normalizeHex,
  relativeLuminance,
  FG_NEAR_BLACK,
  FG_WHITE,
} from "./oshiContrast";

export const SCALE_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

export type ScaleStep = (typeof SCALE_STEPS)[number];

export type BrandScale = Record<ScaleStep, string>;

/** 500＝シード。明るい段は白寄せ、暗い段は黒寄せ。 */
const LIGHT_MIX: Partial<Record<ScaleStep, number>> = {
  50: 0.92,
  100: 0.84,
  200: 0.7,
  300: 0.5,
  400: 0.28,
};

const DARK_MIX: Partial<Record<ScaleStep, number>> = {
  600: 0.18,
  700: 0.36,
  800: 0.52,
  900: 0.68,
  950: 0.8,
};

export function generateBrandScale(seedHex: string): BrandScale {
  const seed = normalizeHex(seedHex);
  const out = {} as BrandScale;
  for (const step of SCALE_STEPS) {
    if (step === 500) {
      out[step] = seed;
      continue;
    }
    const light = LIGHT_MIX[step];
    if (light != null) {
      out[step] = mixHex(seed, FG_WHITE, light);
      continue;
    }
    const dark = DARK_MIX[step];
    out[step] = mixHex(seed, FG_NEAR_BLACK, dark ?? 0.5);
  }
  return out;
}

/** スケール内でシードに最も近い段（通常は 500）。 */
export function pickScaleStepForSeed(
  seedHex: string,
  scale: BrandScale = generateBrandScale(seedHex),
): ScaleStep {
  const seed = normalizeHex(seedHex);
  let best: ScaleStep = 500;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const step of SCALE_STEPS) {
    const dist = Math.abs(
      relativeLuminance(scale[step]) - relativeLuminance(seed),
    );
    if (dist < bestDist) {
      bestDist = dist;
      best = step;
    }
  }
  return best;
}

export type ThemePreviewScheme = "light" | "dark";

/** Lab 見本用セマンティック（本番トークン名に対応する役割）。 */
export type ThemePreviewPack = {
  scheme: ThemePreviewScheme;
  seed: string;
  bg: string;
  fg: string;
  muted: string;
  surface: string;
  border: string;
  primary: string;
  primaryFg: string;
  soft: string;
  destructive: string;
  destructiveFg: string;
  scale: BrandScale;
};

const DESTRUCTIVE_SEED = "#dc2626";

/** 既存 Lab テーマパックの実色を見本パックに載せる（シード再生成しない）。 */
export type LabThemePackColors = {
  scheme: ThemePreviewScheme;
  primary: string;
  primaryFg: string;
  bg: string;
  fg: string;
  muted: string;
  surface: string;
  border: string;
};

export function buildPreviewPackFromLabTheme(
  input: LabThemePackColors,
): ThemePreviewPack {
  const primary = normalizeHex(input.primary);
  const scale = generateBrandScale(primary);
  const destructiveScale = generateBrandScale(DESTRUCTIVE_SEED);
  const soft =
    input.scheme === "light"
      ? mixHex(normalizeHex(input.surface), primary, 0.14)
      : mixHex(normalizeHex(input.surface), primary, 0.22);
  const destructive =
    input.scheme === "light" ? destructiveScale[600] : destructiveScale[400];
  return {
    scheme: input.scheme,
    seed: primary,
    bg: normalizeHex(input.bg),
    fg: normalizeHex(input.fg),
    muted: normalizeHex(input.muted),
    surface: normalizeHex(input.surface),
    border: normalizeHex(input.border),
    primary,
    primaryFg: normalizeHex(input.primaryFg),
    soft,
    destructive,
    destructiveFg: bestForeground(destructive),
    scale,
  };
}

export function buildPreviewPackFromSeed(
  seedHex: string,
  scheme: ThemePreviewScheme,
): ThemePreviewPack {
  const seed = normalizeHex(seedHex);
  const scale = generateBrandScale(seed);
  const destructiveScale = generateBrandScale(DESTRUCTIVE_SEED);

  if (scheme === "light") {
    const bg = mixHex(FG_WHITE, seed, 0.04);
    const surface = FG_WHITE;
    const fg = bestForeground(bg);
    const muted = mixHex(fg, bg, 0.42);
    const border = mixHex(seed, FG_WHITE, 0.72);
    const soft = mixHex(FG_WHITE, seed, 0.14);
    const primary = seed;
    const primaryFg = bestForeground(primary);
    const destructive = destructiveScale[600];
    return {
      scheme,
      seed,
      bg,
      fg,
      muted,
      surface,
      border,
      primary,
      primaryFg,
      soft,
      destructive,
      destructiveFg: bestForeground(destructive),
      scale,
    };
  }

  const bg = mixHex(FG_NEAR_BLACK, seed, 0.12);
  const surface = mixHex(bg, FG_WHITE, 0.08);
  const fg = bestForeground(bg);
  const muted = mixHex(fg, bg, 0.45);
  const border = mixHex(surface, FG_WHITE, 0.14);
  const soft = mixHex(surface, seed, 0.22);
  const primary = scale[400];
  const primaryFg = bestForeground(primary);
  const destructive = destructiveScale[400];
  return {
    scheme,
    seed,
    bg,
    fg,
    muted,
    surface,
    border,
    primary,
    primaryFg,
    soft,
    destructive,
    destructiveFg: bestForeground(destructive),
    scale,
  };
}

export type SemanticContrastRow = {
  id: string;
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  aa_ok: boolean;
};

/** 見本パックの主要ペアのコントラスト一覧。 */
export function listSemanticContrasts(
  pack: ThemePreviewPack,
): SemanticContrastRow[] {
  const pairs: Omit<SemanticContrastRow, "ratio" | "aa_ok">[] = [
    { id: "body", label: "本文 on 背景", fg: pack.fg, bg: pack.bg },
    {
      id: "muted",
      label: "補助 on 背景",
      fg: pack.muted,
      bg: pack.bg,
    },
    {
      id: "primary_btn",
      label: "主ボタン文字 on primary",
      fg: pack.primaryFg,
      bg: pack.primary,
    },
    {
      id: "destructive",
      label: "削除ボタン文字 on destructive",
      fg: pack.destructiveFg,
      bg: pack.destructive,
    },
  ];
  return pairs.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg);
    return { ...p, ratio, aa_ok: ratio >= 4.5 };
  });
}
