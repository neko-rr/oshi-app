import { API_PATHS, type MeResponse } from "@oshi/shared";
import { LogoutButton } from "@/components/logout-button";
import { apiFetch } from "@/lib/api";
import { Link } from "@/i18n/navigation";
import { redirectTo } from "@/i18n/redirect";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function MePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Me");

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!hasSupabase) {
    return (
      <div className="flex flex-col justify-center gap-4 py-10">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-destructive">{t("supabaseMissing")}</p>
        <Link href="/" className="underline">
          {t("home")}
        </Link>
      </div>
    );
  }

  const { createClient } = await import("@/lib/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    await redirectTo("/auth/login");
  }
  const session = data.session!;

  const accessToken = session.access_token;
  let apiMe: MeResponse | null = null;
  let apiError: string | null = null;
  try {
    apiMe = await apiFetch<MeResponse>(API_PATHS.me, { accessToken });
  } catch (e: unknown) {
    apiError = e instanceof Error ? e.message : t("apiMeFailed");
  }

  const sessionEmail = session.user.email ?? null;
  const sessionMembersId = session.user.id;

  return (
    <div className="flex flex-col justify-center gap-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <LogoutButton />
      </div>

      <p className="text-sm text-muted-foreground">{t("intro")}</p>

      <div className="rounded-md border border-border bg-card p-4 text-sm text-card-foreground">
        <p>
          {t("email")}{" "}
          <span className="font-medium">{sessionEmail ?? t("none")}</span>
        </p>
        <p className="mt-2 break-all">
          {t("membersId")}{" "}
          <code className="rounded bg-muted px-1 text-xs">{sessionMembersId}</code>
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-4 text-sm text-card-foreground">
        <p className="font-medium">{t("apiMeTitle")}</p>
        {apiMe ? (
          <ul className="mt-2 space-y-1">
            <li className="break-all">
              {t("membersId")}{" "}
              <code className="rounded bg-muted px-1 text-xs">
                {apiMe.members_id}
              </code>
            </li>
            <li>
              {t("email")} {apiMe.email ?? t("none")}
            </li>
          </ul>
        ) : (
          <p className="mt-2 text-destructive">{apiError}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/settings" className="underline-offset-4 hover:underline">
          {t("toSettings")}
        </Link>
        <Link href="/" className="underline-offset-4 hover:underline">
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
