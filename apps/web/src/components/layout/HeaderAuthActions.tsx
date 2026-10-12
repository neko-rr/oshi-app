"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogoutButton } from "@/components/logout-button";
import { useHasSession } from "@/hooks/useHasSession";

/**
 * ヘッダー用。ログイン状態に応じてログイン／ログアウトを出す。
 * JWT 本文は表示しない。
 */
export function HeaderAuthActions() {
  const t = useTranslations("Nav");
  const signedIn = useHasSession();

  if (signedIn === null) {
    return null;
  }

  if (!signedIn) {
    return (
      <Link href="/auth/login" className="hover:underline">
        {t("login")}
      </Link>
    );
  }

  return <LogoutButton variant="ghost" className="h-auto px-1 py-0 text-xs sm:text-sm" />;
}
