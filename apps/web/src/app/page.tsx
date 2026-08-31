import Link from "next/link";
import { API_PATHS } from "@oshi/shared";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type ProductStats = {
  total: number;
  total_photos: number;
  unique_barcodes: number;
};

export default async function HomePage() {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  let sessionToken: string | null = null;
  if (hasSupabase) {
    const { createClient } = await import("@/lib/server");
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    sessionToken = data.session?.access_token ?? null;
  }

  let stats: ProductStats | null = null;
  let statsError: string | null = null;
  if (sessionToken) {
    try {
      stats = await apiFetch<ProductStats>(API_PATHS.statsProducts, {
        accessToken: sessionToken,
      });
    } catch (e: unknown) {
      statsError =
        e instanceof Error ? e.message : "統計の取得に失敗しました";
    }
  }

  return (
    <div className="flex flex-col justify-center gap-6 py-10">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        oshi-app
      </h1>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground">
        推し活グッズを登録・整理するアプリです。
      </p>

      {sessionToken ? (
        <div className="rounded-md border border-border bg-card p-4 text-sm text-card-foreground">
          {stats ? (
            <ul className="space-y-1">
              <li>登録製品: {stats.total}</li>
              <li>写真あり: {stats.total_photos}</li>
              <li>ユニークバーコード: {stats.unique_barcodes}</li>
            </ul>
          ) : (
            <p className="text-destructive">
              {statsError ?? "統計を表示できません"}
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {!sessionToken ? (
          <Button asChild>
            <Link href="/auth/login">ログイン</Link>
          </Button>
        ) : null}
        <Button asChild variant={sessionToken ? "default" : "secondary"}>
          <Link href="/gallery">ギャラリー</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/register">登録</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/dashboard">ダッシュボード</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/settings">設定</Link>
        </Button>
      </div>
    </div>
  );
}
