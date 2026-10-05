"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Ellipsis, Images, Plus } from "@/lib/icons";
import type { LucideIcon } from "@/lib/icons";

type TabItem = {
  href: "/gallery" | "/register" | "/settings";
  labelKey: "gallery" | "register" | "more";
  Icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const TABS: readonly TabItem[] = [
  {
    href: "/gallery",
    labelKey: "gallery",
    Icon: Images,
    match: (p) => p === "/gallery" || p.startsWith("/gallery/"),
  },
  {
    href: "/register",
    labelKey: "register",
    Icon: Plus,
    match: (p) => p === "/register" || p.startsWith("/register/"),
  },
  {
    href: "/settings",
    labelKey: "more",
    Icon: Ellipsis,
    match: (p) =>
      p === "/settings" ||
      p.startsWith("/settings/") ||
      p === "/dashboard" ||
      p.startsWith("/dashboard/") ||
      p === "/me" ||
      p.startsWith("/me/") ||
      p === "/privacy" ||
      p === "/licenses",
  },
] as const;

/**
 * スマホ幅の本線ナビ（親指ゾーン）。lg 以上は非表示（横向きスマホ幅でもタブ維持）。
 * ギャラリー／登録／その他の3タブ。検索はギャラリー内。
 */
export default function BottomTabBar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 text-foreground backdrop-blur supports-backdrop-filter:bg-background/90 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label={t("ariaTabs")}
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-3 gap-0 px-1 py-1 landscape:py-0.5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.Icon;
          const label = t(tab.labelKey);
          return (
            <li key={tab.href} className="min-w-0">
              <Link
                href={tab.href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[10px] landscape:min-h-9 landscape:gap-0",
                  active
                    ? "font-semibold text-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="size-5 shrink-0 landscape:size-4" aria-hidden />
                <span className="truncate landscape:hidden">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
