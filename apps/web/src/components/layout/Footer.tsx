import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 w-full bg-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-foreground">
        <nav aria-label="フッター" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link
            href="/privacy"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/licenses"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            ライセンス・表記
          </Link>
        </nav>
        <p>© oshi-app</p>
      </div>
    </footer>
  );
}
