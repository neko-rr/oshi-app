"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useIsAnonymous } from "@/hooks/useIsAnonymous";

type Variant = "localOnly" | "serverRequired";

type Props = {
  /** localOnly=端末のみ保存可 / serverRequired=操作そのものに本登録が必要 */
  variant?: Variant;
  className?: string;
};

/**
 * ゲスト向けの文脈付き本登録案内。
 * グローバル GuestBanner に加え、設定・サーバー操作画面で使う。
 */
export function GuestContextNotice({
  variant = "localOnly",
  className,
}: Props) {
  const t = useTranslations("Guest");
  const isAnonymous = useIsAnonymous();
  if (isAnonymous !== true) return null;

  const body =
    variant === "serverRequired" ? t("noticeServerRequired") : t("noticeLocalOnly");

  return (
    <div
      className={[
        "rounded-md border border-border bg-muted/60 px-3 py-2 text-sm text-foreground",
        className ?? "",
      ].join(" ")}
      role="status"
    >
      <p>{body}</p>
      <p className="mt-1">
        <Link
          href="/auth/upgrade"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("goUpgrade")}
        </Link>
      </p>
    </div>
  );
}
