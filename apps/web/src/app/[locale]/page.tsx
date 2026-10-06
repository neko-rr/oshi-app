import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { API_PATHS } from "@oshi/shared";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { isAnonymousUser } from "@/lib/authGuest";
import { PRODUCT_NAME } from "@/lib/brand";

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
  let isGuest = false;
  if (hasSupabase) {
    const { createClient } = await import("@/lib/server");
    const { loadServerAuth } = await import("@/lib/serverAuth");
    const supabase = await createClient();
    const auth = await loadServerAuth(supabase);
    sessionToken = auth?.accessToken ?? null;
    isGuest = isAnonymousUser(auth?.user);
  }

  let stats: ProductStats | null = null;
  let statsError: string | null = null;
  if (sessionToken && !isGuest) {
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
        {PRODUCT_NAME}
      </h1>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground">
        {t("tagline")}
      </p>

      {sessionToken && !isGuest ? (
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

      {isGuest ? (
        <p className="max-w-md text-sm text-muted-foreground">{t("guestHint")}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {!sessionToken ? (
          <Button asChild>
            <Link href="/auth/login">{t("login")}</Link>
          </Button>
        ) : (
          <>
            {isGuest ? (
              <Button asChild>
                <Link href="/auth/upgrade">{t("upgrade")}</Link>
              </Button>
            ) : null}
            <Button
              asChild
              variant={sessionToken && !isGuest ? "default" : "secondary"}
            >
              <Link href="/gallery">{t("gallery")}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/register">{t("register")}</Link>
            </Button>
            <div className="hidden flex-wrap gap-3 lg:flex">
              <Button asChild variant="secondary">
                <Link href="/dashboard">{t("dashboard")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/settings">{t("settings")}</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
