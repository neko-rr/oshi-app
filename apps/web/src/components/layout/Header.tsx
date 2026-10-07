"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeaderAuthActions } from "@/components/layout/HeaderAuthActions";
import { NavLinkPendingHint } from "@/components/layout/NavLinkPendingHint";
import { BRAND_LOGO_SRC, PRODUCT_NAME } from "@/lib/brand";
import { shouldShowAppChromeNav } from "@/lib/appChromePolicy";

type HeaderProps = {
  /**
   * true: スマホはブランド＋認証のみ（下部タブと併用）。
   * 認証画面などタブ無しのときは false で上部に主要リンクも出す。
   */
  compactNav?: boolean;
  /** セッションがあるときだけギャラリー等を出す */
  signedIn?: boolean;
};

function HeaderNavLink({
  href,
  children,
}: {
  href: "/" | "/gallery" | "/register" | "/dashboard" | "/settings";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative inline-flex items-center hover:underline"
    >
      {children}
      <NavLinkPendingHint className="-right-5 top-1/2 -translate-y-1/2" />
    </Link>
  );
}

export default function Header({
  compactNav = true,
  signedIn = false,
}: HeaderProps) {
  const t = useTranslations("Nav");
  const showAppNav = shouldShowAppChromeNav(signedIn);
  const nav = [
    { href: "/", label: t("home"), short: t("homeShort") },
    { href: "/gallery", label: t("gallery"), short: t("galleryShort") },
    { href: "/register", label: t("register"), short: t("registerShort") },
    { href: "/dashboard", label: t("dashboard"), short: t("dashboardShort") },
    { href: "/settings", label: t("settings"), short: t("settingsShort") },
  ] as const;
  const visibleNav = showAppNav ? nav : [];

  return (
    <header
      className="sticky top-0 z-10 w-full border-b border-border bg-background text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <Link
          href="/"
          className="relative flex shrink-0 items-center gap-2 text-lg font-bold hover:opacity-80 sm:text-xl"
        >
          <Image
            src={BRAND_LOGO_SRC}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-md"
            unoptimized
            priority
          />
          {PRODUCT_NAME}
          <NavLinkPendingHint className="-right-6 top-1/2 -translate-y-1/2" />
        </Link>
        {/* デスクトップ: 従来どおり横ナビ */}
        <nav
          className="hidden items-center gap-x-3 text-sm lg:flex"
          aria-label={t("ariaMain")}
        >
          {visibleNav.map((item) => (
            <HeaderNavLink key={item.href} href={item.href}>
              {item.label}
            </HeaderNavLink>
          ))}
          <HeaderAuthActions />
        </nav>
        {/* スマホ・横向き: スリム（タブ併用時）または折返しナビ（認証など） */}
        <div className="flex max-w-[70%] flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs lg:hidden">
          {compactNav ? null : (
            <nav
              className="flex max-w-full flex-wrap items-center justify-end gap-x-2 gap-y-1"
              aria-label={t("ariaMain")}
            >
              {visibleNav.map((item) => (
                <HeaderNavLink key={item.href} href={item.href}>
                  {item.short}
                </HeaderNavLink>
              ))}
            </nav>
          )}
          <HeaderAuthActions />
        </div>
      </div>
    </header>
  );
}
