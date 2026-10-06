import type { Metadata } from "next";
import LabFontPackStudio from "@/components/design-lab/LabFontPackStudio";

export const metadata: Metadata = {
  title: "Font packs · Design Lab",
  robots: { index: false, follow: false },
};

/** 文字パック候補スタジオ（開発専用） */
export default function DesignLabFontPacksPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="mx-auto max-w-lg p-8 text-center text-zinc-800">
        <h1 className="text-lg font-semibold">利用できません</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Design Lab の文字パック見本は開発環境専用です。
        </p>
      </main>
    );
  }

  return <LabFontPackStudio />;
}
