import type { MetadataRoute } from "next";
import { BRAND_MARK_BACKGROUND, PRODUCT_NAME } from "@/lib/brand";

const DESCRIPTION = "Merch & storage — グッズの場所がわかる";

/**
 * ホーム画面に追加したときの名前とアイコン。
 * アイコンは app/icon.png（風ねこシルエット）。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    description: DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BRAND_MARK_BACKGROUND,
    theme_color: BRAND_MARK_BACKGROUND,
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
