"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GuestContextNotice } from "@/components/auth/GuestContextNotice";
import { useIsAnonymous } from "@/hooks/useIsAnonymous";

type Props = {
  backHref?: string;
  title: string;
  children: ReactNode;
};

/**
 * サーバー操作が必要な設定画面用。
 * ゲストなら本登録案内だけ示し、children（API 操作 UI）は出さない。
 */
export function GuestServerGate({
  backHref = "/settings",
  title,
  children,
}: Props) {
  const tCommon = useTranslations("Common");
  const isAnonymous = useIsAnonymous();

  if (isAnonymous === null) {
    return (
      <p className="py-6 text-sm text-muted-foreground">{tCommon("loading")}</p>
    );
  }

  if (isAnonymous) {
    return (
      <div className="stack-density-lg text-foreground">
        <div>
          <Link
            href={backHref}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {tCommon("backToSettings")}
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
        <GuestContextNotice variant="serverRequired" />
      </div>
    );
  }

  return <>{children}</>;
}
