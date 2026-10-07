"use client";

import { useTranslations } from "next-intl";
import { MascotLoadingSilhouette } from "@/components/mascot/MascotSilhouetteMark";

/**
 * App Router の loading.tsx 用。シェル（Header／タブ）は残し、主領域だけ差し替え。
 */
export function RouteLoadingFallback() {
  const t = useTranslations("Common");

  return (
    <div
      className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-4 px-4 py-12 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <MascotLoadingSilhouette />
      <p className="text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  );
}
