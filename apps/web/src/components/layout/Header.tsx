import Link from "next/link";
import { HeaderAuthActions } from "@/components/layout/HeaderAuthActions";

const NAV = [
  { href: "/", label: "ホーム", short: "Home" },
  { href: "/gallery", label: "ギャラリー", short: "一覧" },
  { href: "/search", label: "検索", short: "検索" },
  { href: "/register", label: "登録", short: "登録" },
  { href: "/dashboard", label: "ダッシュボード", short: "分析" },
  { href: "/settings", label: "設定", short: "設定" },
] as const;

export default function Header() {
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
          aria-label="メイン"
        >
          {NAV.map((item) => (
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
