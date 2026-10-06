import {
  Atkinson_Hyperlegible,
  BIZ_UDPGothic,
  Figtree,
  Noto_Sans_JP,
  Nunito_Sans,
  Plus_Jakarta_Sans,
  Zen_Kaku_Gothic_New,
  Zen_Maru_Gothic,
} from "next/font/google";

/** 清潔（既定本文）。欧文は Plus Jakarta、和文は Noto。 */
export const fontPlusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plus-jakarta",
  preload: true,
});

export const fontNotoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-jp",
  preload: true,
  adjustFontFallback: false,
});

/** やわらか。本文 Nunito + Noto、見出し Zen Maru。 */
export const fontNunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-nunito-sans",
  preload: false,
});

export const fontZenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-zen-maru",
  preload: false,
  adjustFontFallback: false,
});

/** 雑誌・大人。Figtree + Zen Kaku。 */
export const fontFigtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-figtree",
  preload: false,
});

export const fontZenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-zen-kaku",
  preload: false,
  adjustFontFallback: false,
});

/** 読みやすい。Atkinson + BIZ UDPGothic。 */
export const fontAtkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-atkinson",
  preload: false,
});

export const fontBizUdpgothic = BIZ_UDPGothic({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-biz-udpgothic",
  preload: false,
  adjustFontFallback: false,
});

/** html に載せる CSS 変数クラス（全パック分。未使用パックは preload しない） */
export const fontPackVariableClassName = [
  fontPlusJakarta.variable,
  fontNotoSansJp.variable,
  fontNunitoSans.variable,
  fontZenMaru.variable,
  fontFigtree.variable,
  fontZenKaku.variable,
  fontAtkinson.variable,
  fontBizUdpgothic.variable,
].join(" ");
