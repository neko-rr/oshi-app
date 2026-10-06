import {
  Atkinson_Hyperlegible,
  Dela_Gothic_One,
  M_PLUS_2,
  Outfit,
  Plus_Jakarta_Sans,
  Zen_Maru_Gothic,
} from "next/font/google";

/** Lab 提案用。本番 layout には載せない。 */

export const labFontPlusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-lab-plus-jakarta",
  preload: false,
});

export const labFontZenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-lab-zen-maru",
  preload: false,
  adjustFontFallback: false,
});

export const labFontAtkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-lab-atkinson",
  preload: false,
});

export const labFontDelaGothic = Dela_Gothic_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-lab-dela-gothic",
  preload: false,
  adjustFontFallback: false,
});

export const labFontOutfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-lab-outfit",
  preload: false,
});

export const labFontMPlus2 = M_PLUS_2({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-lab-mplus2",
  preload: false,
  adjustFontFallback: false,
});

export const labFontPackVariableClassName = [
  labFontPlusJakarta.variable,
  labFontZenMaru.variable,
  labFontAtkinson.variable,
  labFontDelaGothic.variable,
  labFontOutfit.variable,
  labFontMPlus2.variable,
].join(" ");
