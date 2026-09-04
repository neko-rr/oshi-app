import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "oshi-app",
  description: "推し活グッズ管理（Next.js + FastAPI）",
};

/** localStorage の見た目設定を初回描画前に html へ載せ、チラつきを抑える */
const PREFS_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("oshiapp:themeId");if(t){d.setAttribute("data-theme",t);}var raw=localStorage.getItem("oshiapp:displaySettings");if(!raw)return;var p=JSON.parse(raw);var s=Number(p&&p.text_scale);var u=Number(p&&p.ui_density);if(Number.isInteger(s)&&s>=1&&s<=7){d.setAttribute("data-text-scale",String(s));}if(Number.isInteger(u)&&u>=1&&u<=7){d.setAttribute("data-ui-density",String(u));}}catch(e){}})();`;

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
