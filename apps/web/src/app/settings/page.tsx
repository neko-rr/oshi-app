"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";

type HubSection = {
  title: string;
  links: readonly { href: string; label: string }[];
};

const HUB_SECTIONS: readonly HubSection[] = [
  {
    title: "見た目",
    links: [{ href: "/settings/theme", label: "テーマ（緑が既定）" }],
  },
  {
    title: "タグ・収納",
    links: [
      { href: "/settings/color-tags", label: "カラータグ" },
      { href: "/settings/category-tags", label: "カテゴリータグ" },
      { href: "/settings/storage-locations", label: "収納場所" },
    ],
  },
  {
    title: "アカウント",
    links: [
      { href: "/me", label: "アカウント情報" },
      { href: "/auth/update-password", label: "パスワード変更" },
    ],
  },
  {
    title: "法務",
    links: [
      { href: "/privacy", label: "プライバシーポリシー" },
      { href: "/licenses", label: "ライセンス・表記" },
    ],
  },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

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

  if (!ready) {
    return (
      <p className="py-6 text-sm text-muted-foreground">読み込み中…</p>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          テーマ・タグ・収納・アカウント
        </p>
      </div>

      {HUB_SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {section.title}
          </h2>
          <ul className="flex flex-col gap-2">
            {section.links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md border border-border bg-card px-4 py-3 text-card-foreground hover:opacity-90"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {process.env.NODE_ENV === "development" ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">開発</h2>
          <ul className="flex flex-col gap-2">
            <li>
              <Link
                href="/dev/design-lab"
                className="block rounded-md border border-dashed border-border bg-card px-4 py-3 text-card-foreground hover:opacity-90"
              >
                Design Lab（3案比較・開発用・未ログイン可）
              </Link>
            </li>
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <LogoutButton variant="destructive" />
        <Button asChild type="button" variant="outline">
          <Link href="/">ホームへ</Link>
        </Button>
      </div>
    </div>
  );
}
