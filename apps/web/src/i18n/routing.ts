import { defineRouting } from "next-intl/routing";

/**
 * App Router の言語ルーティング。
 * - 既定 ja: `/gallery`（プレフィックスなし）
 * - en: `/en/gallery`
 * 言語追加時は locales に足し、messages/<locale>.json を用意する。
 */
export const routing = defineRouting({
  locales: ["ja", "en"],
  defaultLocale: "ja",
  localePrefix: "as-needed",
});
