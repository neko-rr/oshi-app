import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import {
  BRAND_MARK_BACKGROUND,
  DISPLAY_SETTINGS_LOCAL_KEY,
  MASCOT_LOCAL_KEY,
  PRODUCT_NAME,
  PRODUCT_ORIGIN,
  SITE_INDEXABLE,
  THEME_LOCAL_KEY,
} from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const SITE_DESCRIPTION = "Merch & storage — グッズの場所がわかる";

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCT_ORIGIN),
  applicationName: PRODUCT_NAME,
  title: PRODUCT_NAME,
  description: SITE_DESCRIPTION,
  robots: SITE_INDEXABLE
    ? { index: true, follow: true }
    : {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
  appleWebApp: {
    capable: true,
    title: PRODUCT_NAME,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: PRODUCT_NAME,
    url: PRODUCT_ORIGIN,
    title: PRODUCT_NAME,
    description: SITE_DESCRIPTION,
  },
};

/** ノッチ端末でもタブ余白を取れるようにする */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: BRAND_MARK_BACKGROUND,
};

/** localStorage の見た目設定を初回描画前に html へ載せ、チラつきを抑える */
const PREFS_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem(${JSON.stringify(THEME_LOCAL_KEY)});if(t){d.setAttribute("data-theme",t);}var m=localStorage.getItem(${JSON.stringify(MASCOT_LOCAL_KEY)});if(m){d.setAttribute("data-mascot",m);}var raw=localStorage.getItem(${JSON.stringify(DISPLAY_SETTINGS_LOCAL_KEY)});if(!raw)return;var p=JSON.parse(raw);var s=Number(p&&p.text_scale);var u=Number(p&&p.ui_density);if(Number.isInteger(s)&&s>=1&&s<=7){d.setAttribute("data-text-scale",String(s));}if(Number.isInteger(u)&&u>=1&&u<=7){d.setAttribute("data-ui-density",String(u));}}catch(e){}})();`;

type Props = {
  children: React.ReactNode;
};

/**
 * ルート layout。html/body のみ。
 * 言語・シェルは app/[locale]/layout.tsx。
 */
export default function RootLayout({ children }: Props) {
  return (
    <html
      lang="ja"
      className={geistSans.variable}
      data-theme="default"
      data-mascot="kaze_neko"
      data-text-scale="3"
      data-ui-density="4"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-svh flex-col antialiased">{children}</body>
    </html>
  );
}
