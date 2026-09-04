import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { API_PATHS } from "@oshi/shared";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type ProductStats = {
  total: number;
  total_photos: number;
  unique_barcodes: number;
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HomePage");

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
        e instanceof Error ? e.message : t("statsUnavailable");
    }
  }

  return (
    <div className="stack-density-lg justify-center py-10">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        oshi-app
      </h1>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground">
        {t("tagline")}
      </p>

      {sessionToken ? (
        <div className="rounded-md border border-border bg-card p-4 text-sm text-card-foreground">
          {stats ? (
            <ul className="space-y-1">
              <li>{t("statsProducts", { count: stats.total })}</li>
              <li>{t("statsPhotos", { count: stats.total_photos })}</li>
              <li>{t("statsBarcodes", { count: stats.unique_barcodes })}</li>
            </ul>
          ) : (
            <p className="text-destructive">
              {statsError ?? t("statsUnavailable")}
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {!sessionToken ? (
          <Button asChild>
            <Link href="/auth/login">{t("login")}</Link>
          </Button>
        ) : null}
        <Button asChild variant={sessionToken ? "default" : "secondary"}>
          <Link href="/gallery">{t("gallery")}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/register">{t("register")}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/search">{t("search")}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/dashboard">{t("dashboard")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/settings">{t("settings")}</Link>
        </Button>
      </div>
    </div>
  );
}
