"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeaderAuthActions } from "@/components/layout/HeaderAuthActions";

export default function Header() {
  const t = useTranslations("Nav");
  const nav = [
    { href: "/", label: t("home"), short: t("homeShort") },
    { href: "/gallery", label: t("gallery"), short: t("galleryShort") },
    { href: "/search", label: t("search"), short: t("searchShort") },
    { href: "/register", label: t("register"), short: t("registerShort") },
    { href: "/dashboard", label: t("dashboard"), short: t("dashboardShort") },
    { href: "/settings", label: t("settings"), short: t("settingsShort") },
  ] as const;

  return (
    <header className="sticky top-0 z-10 w-full border-b border-border bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold hover:opacity-80 sm:text-xl"
        >
          oshi-app
        </Link>
        <nav
          className="flex max-w-[75%] flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs sm:max-w-none sm:gap-x-3 sm:gap-y-2 sm:text-sm"
          aria-label={t("ariaMain")}
        >
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
          <HeaderAuthActions />
        </nav>
      </div>
    </header>
  );
}
