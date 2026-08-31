import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "oshi-app",
  description: "推し活グッズ管理（Next.js + FastAPI）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={geistSans.variable} data-theme="default">
      <body className="flex min-h-svh flex-col antialiased">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
