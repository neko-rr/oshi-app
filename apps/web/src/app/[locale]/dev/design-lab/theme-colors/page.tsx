import type { Metadata } from "next";
import LabThemeColorStudio from "@/components/design-lab/LabThemeColorStudio";

export const metadata: Metadata = {
  title: "Theme colors · Design Lab",
  robots: { index: false, follow: false },
};

/** テーマ色見本スタジオ（開発専用・UI Colors 風） */
export default function DesignLabThemeColorsPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="mx-auto max-w-lg p-8 text-center text-zinc-800">
        <h1 className="text-lg font-semibold">利用できません</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Design Lab のテーマ色見本は開発環境専用です。
        </p>
      </main>
    );
  }

  return <LabThemeColorStudio />;
}
