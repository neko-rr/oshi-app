import { Link } from "@/i18n/navigation";
import { redirectTo } from "@/i18n/redirect";
import { API_PATHS } from "@oshi/shared";
import { apiFetch } from "@/lib/api";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
  noDataLabel,
}: {
  title: string;
  items: unknown[];
  noDataLabel: string;
}) {
  return (
    <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
      <h2 className="mb-2 text-lg font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{noDataLabel}</p>
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

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!hasSupabase) {
    await redirectTo("/auth/login");
  }

  const { createClient } = await import("@/lib/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    await redirectTo("/auth/login");
  }
  const session = data.session!;

  let charts: DashboardCharts | null = null;
  let loadError: string | null = null;
  try {
    charts = await apiFetch<DashboardCharts>(
      `${API_PATHS.dashboardCharts}?granularity=month`,
      { accessToken: session.access_token },
    );
  } catch (e: unknown) {
    loadError =
      e instanceof Error ? e.message : t("loadFailed");
  }

  return (
    <div className="stack-density-lg">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
        </div>
        <Link href="/" className="text-sm underline-offset-4 hover:underline">
          {t("home")}
        </Link>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {charts ? (
        <div className="flex flex-col gap-4">
          <SectionList
            title={t("spendSeries")}
            items={charts.spend_series ?? []}
            noDataLabel={t("noData")}
          />
          <SectionList
            title={t("productMix")}
            items={charts.product_mix ?? []}
            noDataLabel={t("noData")}
          />
          <SectionList
            title={t("categoryTags")}
            items={charts.category_tags ?? []}
            noDataLabel={t("noData")}
          />
          <SectionList
            title={t("storageLocations")}
            items={charts.storage_locations ?? []}
            noDataLabel={t("noData")}
          />
          <SectionList
            title={t("colorTags")}
            items={charts.color_tags ?? []}
            noDataLabel={t("noData")}
          />
          {charts.meta && Object.keys(charts.meta).length > 0 ? (
            <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
              <h2 className="mb-2 text-lg font-medium">{t("meta")}</h2>
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
