import { Link } from "@/i18n/navigation";
import { redirectTo } from "@/i18n/redirect";
import { API_PATHS } from "@oshi/shared";
import { apiFetch } from "@/lib/api";
import { isAnonymousUser } from "@/lib/authGuest";
import { CollectionSummary } from "@/components/dashboard/CollectionSummary";
import { ColorTagSharePanel } from "@/components/dashboard/ColorTagSharePanel";
import { getTranslations, setRequestLocale } from "next-intl/server";

function metaNumber(meta: Record<string, unknown>, key: string): number {
  const n = meta[key];
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

type DashboardCharts = {
  color_tags: unknown[];
  meta: Record<string, unknown>;
  collection?: unknown;
  budgets?: unknown;
  oshi_days?: unknown;
};

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
  const { loadServerAuth } = await import("@/lib/serverAuth");
  const supabase = await createClient();
  const auth = await loadServerAuth(supabase);
  if (!auth) {
    await redirectTo("/auth/login");
  }
  const { user, accessToken } = auth!;
  const isGuest = isAnonymousUser(user);

  let charts: DashboardCharts | null = null;
  let loadError: string | null = null;
  if (!isGuest) {
    try {
      charts = await apiFetch<DashboardCharts>(
        `${API_PATHS.dashboardCharts}?granularity=month`,
        { accessToken },
      );
    } catch (e: unknown) {
      loadError =
        e instanceof Error ? e.message : t("loadFailed");
    }
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

      {isGuest ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t("emptyGuest")}</p>
          <Link
            href="/auth/upgrade"
            className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("upgradeLink")}
          </Link>
        </div>
      ) : null}

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {charts ? (
        <div className="flex flex-col gap-4">
          <CollectionSummary
            raw={charts.collection}
            budgets={charts.budgets}
            oshiDays={charts.oshi_days}
          />
          <ColorTagSharePanel
            title={t("colorShareTitle")}
            hint={t("colorShareHint")}
            items={charts.color_tags ?? []}
            noDataLabel={t("colorShareEmpty")}
            assignmentLabel={t("colorShareAssignments", {
              count: metaNumber(
                charts.meta ?? {},
                "color_tag_assignment_total",
              ),
            })}
            untaggedLabel={t("colorShareUntagged", {
              count: metaNumber(charts.meta ?? {}, "color_tag_untagged_count"),
            })}
            assignmentTotal={metaNumber(
              charts.meta ?? {},
              "color_tag_assignment_total",
            )}
            untaggedCount={metaNumber(
              charts.meta ?? {},
              "color_tag_untagged_count",
            )}
            pieLabel={t("colorSharePieAria")}
          />
        </div>
      ) : null}
    </div>
  );
}
