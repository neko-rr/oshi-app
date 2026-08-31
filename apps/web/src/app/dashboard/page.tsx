import Link from "next/link";
import { redirect } from "next/navigation";
import { API_PATHS } from "@oshi/shared";
import { apiFetch } from "@/lib/api";

type DashboardCharts = {
  spend_series: unknown[];
  product_mix: unknown[];
  category_tags: unknown[];
  storage_locations: unknown[];
  color_tags: unknown[];
  meta: Record<string, unknown>;
};

function SectionList({
  title,
  items,
}: {
  title: string;
  items: unknown[];
}) {
  return (
    <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
      <h2 className="mb-2 text-lg font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">データなし</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item, i) => (
            <li
              key={i}
              className="rounded border border-border bg-background px-2 py-1 font-mono text-xs"
            >
              {typeof item === "object" && item !== null
                ? JSON.stringify(item)
                : String(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!hasSupabase) {
    redirect("/auth/login");
  }

  const { createClient } = await import("@/lib/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    redirect("/auth/login");
  }

  let charts: DashboardCharts | null = null;
  let loadError: string | null = null;
  try {
    charts = await apiFetch<DashboardCharts>(
      `${API_PATHS.dashboardCharts}?granularity=month`,
      { accessToken: data.session.access_token },
    );
  } catch (e: unknown) {
    loadError =
      e instanceof Error ? e.message : "ダッシュボードの取得に失敗しました";
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            ダッシュボード
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            GET /dashboard/charts?granularity=month（仮 UI）
          </p>
        </div>
        <Link href="/" className="text-sm underline-offset-4 hover:underline">
          ホーム
        </Link>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {charts ? (
        <div className="flex flex-col gap-4">
          <SectionList title="支出シリーズ (spend_series)" items={charts.spend_series ?? []} />
          <SectionList title="製品ミックス (product_mix)" items={charts.product_mix ?? []} />
          <SectionList title="カテゴリータグ (category_tags)" items={charts.category_tags ?? []} />
          <SectionList
            title="収納場所 (storage_locations)"
            items={charts.storage_locations ?? []}
          />
          <SectionList title="カラータグ (color_tags)" items={charts.color_tags ?? []} />
          {charts.meta && Object.keys(charts.meta).length > 0 ? (
            <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
              <h2 className="mb-2 text-lg font-medium">メタ (meta)</h2>
              <pre className="overflow-auto text-xs">
                {JSON.stringify(charts.meta, null, 2)}
              </pre>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
