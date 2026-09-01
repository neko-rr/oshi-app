"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemePicker from "@/components/ui/ThemePicker";
import { createClient } from "@/lib/client";

export default function ThemeSettingsPage() {
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
    <div className="flex flex-col gap-6 py-6 text-foreground">
      <div>
        <Link
          href="/settings"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← 設定
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          自分の色にする
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          選ぶと画面の色がまとめて変わります。既定は緑です。枠の黒／白でライトとダークが分かります。
        </p>
      </div>

      <ThemePicker />
    </div>
  );
}
