"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MascotLoadingSilhouette } from "@/components/mascot/MascotSilhouetteMark";
import { API_WAKE_OVERLAY_DELAY_MS } from "@/lib/wakeApi";

/**
 * Render Free スリープ明け待ちの全画面オーバーレイ。
 * 親が待ち中だけマウントする。すぐ起きたときは遅延内にアンマウントされ出ない。
 */
export function ApiWakeOverlay() {
  const t = useTranslations("ApiWake");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, API_WAKE_OVERLAY_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 px-6 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <MascotLoadingSilhouette />
      <p className="text-base font-medium text-foreground">{t("title")}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{t("body")}</p>
    </div>
  );
}
