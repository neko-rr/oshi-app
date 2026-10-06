import {
  BIZ_UDPGothic,
  Figtree,
  Fraunces,
  IBM_Plex_Sans,
  IBM_Plex_Sans_JP,
  Kaisei_Decol,
  Kiwi_Maru,
  Klee_One,
  Lexend,
  Newsreader,
  Noto_Sans_JP,
  Nunito_Sans,
  Shantell_Sans,
  Shippori_Antique,
  Zen_Kaku_Gothic_New,
} from "next/font/google";

/** 清潔（既定本文）。IBM Plex。 */
export const fontIbmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
  preload: true,
});

export const fontIbmPlexJp = IBM_Plex_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-ibm-plex-jp",
  preload: true,
  adjustFontFallback: false,
});

/** やわらか。本文 Nunito + Noto、見出し Kiwi Maru。 */
export const fontNunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-nunito-sans",
  preload: false,
});

export const fontNotoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-jp",
  preload: false,
  adjustFontFallback: false,
});

export const fontKiwiMaru = Kiwi_Maru({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-kiwi-maru",
  preload: false,
  adjustFontFallback: false,
});

/** 雑誌。本文 Figtree + Zen Kaku、見出し Newsreader + Kaisei Decol。 */
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

export const fontNewsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-newsreader",
  preload: false,
});

export const fontKaiseiDecol = Kaisei_Decol({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-kaisei-decol",
  preload: false,
  adjustFontFallback: false,
});

/** 読みやすい。Lexend + BIZ UDPGothic。 */
export const fontLexend = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-lexend",
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

/** 物語。見出しだけ Antique＋Fraunces。本文は清潔と同じ。 */
export const fontShipporiAntique = Shippori_Antique({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-shippori-antique",
  preload: false,
  adjustFontFallback: false,
});

export const fontFraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-fraunces",
  preload: false,
});

/** 手帳。見出しだけ Klee One＋Shantell Sans。本文は清潔と同じ。 */
export const fontKleeOne = Klee_One({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-klee-one",
  preload: false,
  adjustFontFallback: false,
});

export const fontShantellSans = Shantell_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-shantell-sans",
  preload: false,
});

/** html に載せる CSS 変数クラス（全パック分。未使用パックは preload しない） */
export const fontPackVariableClassName = [
  fontIbmPlexSans.variable,
  fontIbmPlexJp.variable,
  fontNunitoSans.variable,
  fontNotoSansJp.variable,
  fontKiwiMaru.variable,
  fontFigtree.variable,
  fontZenKaku.variable,
  fontNewsreader.variable,
  fontKaiseiDecol.variable,
  fontLexend.variable,
  fontBizUdpgothic.variable,
  fontShipporiAntique.variable,
  fontFraunces.variable,
  fontKleeOne.variable,
  fontShantellSans.variable,
].join(" ");
