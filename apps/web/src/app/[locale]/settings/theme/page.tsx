"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import ThemePicker from "@/components/ui/ThemePicker";
import { DisplaySettingsPanel } from "@/components/settings/DisplaySettingsPanel";
import { LocaleSwitcher } from "@/components/settings/LocaleSwitcher";
import { OshiAccentPanel } from "@/components/settings/OshiAccentPanel";
import { ResidenceSettingsPanel } from "@/components/settings/ResidenceSettingsPanel";
import { createClient } from "@/lib/client";

export default function AppearanceSettingsPage() {
  const t = useTranslations("Appearance");
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
      <p className="py-6 text-sm text-muted-foreground">{t("loading")}</p>
    );
  }

  return (
    <div className="stack-density-lg text-foreground">
      <div>
        <Link
          href="/settings"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("back")}
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <section className="stack-density">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("themeTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("themeHint")}</p>
        <ThemePicker />
      </section>

      <details className="group rounded-2xl border border-dashed border-border bg-muted/20 open:bg-muted/30">
        <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold tracking-tight text-foreground">
              {t("oshiTitle")}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {t("oshiPremiumBadge")}
            </span>
            <span className="text-xs text-muted-foreground group-open:hidden">
              {t("oshiCollapsedHint")}
            </span>
            <span
              className="ml-auto text-xs text-muted-foreground"
              aria-hidden
            >
              <span className="group-open:hidden">{t("oshiExpand")}</span>
              <span className="hidden group-open:inline">{t("oshiCollapse")}</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("oshiHint")}</p>
        </summary>
        <div className="border-t border-border/60 px-2 pb-3 pt-1 sm:px-3">
          <OshiAccentPanel />
        </div>
      </details>

      <section className="stack-density">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("languageTitle")}
        </h2>
        <LocaleSwitcher />
      </section>

      <section className="stack-density">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("residenceTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("residenceHint")}</p>
        <ResidenceSettingsPanel />
      </section>

      <section className="stack-density">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("readabilityTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("readabilityHint")}</p>
        <DisplaySettingsPanel />
      </section>
    </div>
  );
}
