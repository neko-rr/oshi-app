"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";

const HUB_LINKS = [
  { href: "/settings/color-tags", label: "カラータグ" },
  { href: "/settings/category-tags", label: "カテゴリータグ" },
  { href: "/settings/storage-locations", label: "収納場所" },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error || !data.session) {
        router.replace("/auth/login");
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onLogout() {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (!ready) {
    return (
      <p className="py-6 text-sm text-muted-foreground">読み込み中…</p>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          タグ・収納場所の管理とログアウト
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {HUB_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-md border border-border bg-card px-4 py-3 text-card-foreground hover:opacity-90"
            >
              {item.label}
            </Link>
          </li>
        ))}
        {process.env.NODE_ENV === "development" ? (
          <li>
            <Link
              href="/dev/design-lab"
              className="block rounded-md border border-dashed border-border bg-card px-4 py-3 text-card-foreground hover:opacity-90"
            >
              Design Lab（3案比較・開発用）
            </Link>
          </li>
        ) : null}
      </ul>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="destructive"
          disabled={loggingOut}
          onClick={onLogout}
        >
          {loggingOut ? "ログアウト中…" : "ログアウト"}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href="/">ホームへ</Link>
        </Button>
      </div>
    </div>
  );
}
