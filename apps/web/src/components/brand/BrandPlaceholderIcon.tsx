/**
 * ホーム画面・共有用の仮アイコン。
 * 本番イラストに替えるときは、このファイルを使っている
 * `src/app/icon.tsx` と `src/app/apple-icon.tsx` を削除し、
 * 同じ場所に `icon.png`（512）と `apple-icon.png`（180）を置く。
 * Next.js がメタデータへ自動で載せる。
 */

import { ImageResponse } from "next/og";
import {
  BRAND_MARK_BACKGROUND,
  BRAND_MARK_FOREGROUND,
} from "@/lib/brand";

export function BrandPlaceholderIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_MARK_BACKGROUND,
          color: BRAND_MARK_FOREGROUND,
          fontSize: Math.round(size * 0.42),
          fontWeight: 700,
          letterSpacing: "-0.06em",
        }}
      >
        Oh
      </div>
    ),
    { width: size, height: size },
  );
}
