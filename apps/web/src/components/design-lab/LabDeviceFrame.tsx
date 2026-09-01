"use client";

import type { ReactNode } from "react";
import LabThumbZoneOverlay from "@/components/design-lab/LabThumbZoneOverlay";
import type {
  LabPhoneOrientationId,
  LabPlatformId,
} from "@/components/design-lab/lab-meta";
import { LAB_PHONE_FRAME_SIZE } from "@/components/design-lab/lab-meta";
import type { LabTextScaleId } from "@/components/design-lab/lab-ux-preview";
import { LAB_TEXT_SCALES } from "@/components/design-lab/lab-ux-preview";

type LabDeviceFrameProps = {
  platform: LabPlatformId;
  children: ReactNode;
  /** モバイル枠のみ。親指ゾーンオーバーレイ */
  showThumbZone?: boolean;
  textScale?: LabTextScaleId;
  /** web-mobile / mobile-app のみ。既定は縦 */
  orientation?: LabPhoneOrientationId;
};

/**
 * 端末プレビュー枠。中身の案（A/B/C）は変えず、見え方の幅とクロムだけ切り替える。
 */
export default function LabDeviceFrame({
  platform,
  children,
  showThumbZone = false,
  textScale = "normal",
  orientation = "portrait",
}: LabDeviceFrameProps) {
  const scale =
    LAB_TEXT_SCALES.find((t) => t.id === textScale)?.scale ?? 1;
  const contentStyle =
    scale !== 1 ? ({ fontSize: `${scale * 100}%` } as const) : undefined;

  if (platform === "web-pc") {
    return (
      <div className="w-full min-w-0" style={contentStyle} data-lab-text-scale={textScale}>
        {children}
      </div>
    );
  }

  const isApp = platform === "mobile-app";
  const thumbOn = showThumbZone;
  const isLandscape = orientation === "landscape";
  const size = LAB_PHONE_FRAME_SIZE[orientation];
  const orientLabel = isLandscape ? "横" : "縦";

  return (
    <div
      className="mx-auto w-full"
      style={{ maxWidth: size.widthPx }}
      data-lab-orientation={orientation}
    >
      <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-zinc-800 bg-zinc-800 shadow-lg">
        {isApp ? (
          <div className="flex items-center justify-between bg-zinc-900 px-4 py-1.5 text-[10px] text-zinc-300">
            <span>9:41</span>
            <span className="font-medium tracking-wide">oshi-app</span>
            <span aria-hidden>●●</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-zinc-700 px-3 py-2">
            <span className="size-1.5 rounded-full bg-zinc-500" aria-hidden />
            <span className="size-1.5 rounded-full bg-zinc-500" aria-hidden />
            <span className="size-1.5 rounded-full bg-zinc-500" aria-hidden />
            <span className="ml-2 flex-1 truncate rounded bg-zinc-600 px-2 py-0.5 text-[10px] text-zinc-300">
              localhost/…
            </span>
          </div>
        )}
        <div
          className="relative overflow-y-auto bg-[var(--lab-bg)]"
          style={{
            ...contentStyle,
            maxHeight: `min(72vh, ${size.contentMaxHeightPx}px)`,
          }}
          data-lab-text-scale={textScale}
        >
          {children}
          <LabThumbZoneOverlay visible={thumbOn} />
        </div>
        {isApp ? (
          <nav
            className="grid grid-cols-4 gap-1 border-t border-zinc-700 bg-zinc-900 px-1 py-2 text-center text-[9px] text-zinc-400"
            aria-label="アプリ想定のタブ（見本）"
          >
            <span className="text-[var(--lab-primary)]">ホーム</span>
            <span>ギャラリー</span>
            <span>登録</span>
            <span>設定</span>
          </nav>
        ) : null}
      </div>
      <p className="mt-2 text-center text-[10px] text-zinc-500">
        {isApp ? "モバイルアプリ想定フレーム" : "Web・モバイル幅フレーム"}
        {` · ${orientLabel}`}
        {thumbOn ? " · 親指ゾーン表示中" : ""}
      </p>
    </div>
  );
}
