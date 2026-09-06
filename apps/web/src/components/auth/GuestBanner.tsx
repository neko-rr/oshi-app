"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useIsAnonymous } from "@/hooks/useIsAnonymous";

/** ゲスト中のみ表示する本登録バナー。 */
export function GuestBanner() {
  const t = useTranslations("Guest");
  const isAnonymous = useIsAnonymous();
  if (isAnonymous !== true) return null;

  return (
    <div
      className="border-b border-border bg-muted px-4 py-2 text-center text-sm text-foreground"
      role="status"
    >
      {t("banner")}{" "}
      <Link
        href="/auth/upgrade"
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("goUpgrade")}
      </Link>
    </div>
  );
}
