import Link from "next/link";
import ThemePicker from "@/components/ui/ThemePicker";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-border bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 text-xl font-bold hover:opacity-80">
          oshi-app
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm sm:gap-4">
          <Link href="/" className="hover:underline">
            ホーム
          </Link>
          <Link href="/gallery" className="hover:underline">
            ギャラリー
          </Link>
          <Link href="/register" className="hover:underline">
            登録
          </Link>
          <Link href="/dashboard" className="hover:underline">
            ダッシュボード
          </Link>
          <Link href="/settings" className="hover:underline">
            設定
          </Link>
          <ThemePicker />
        </nav>
      </div>
    </header>
  );
}
