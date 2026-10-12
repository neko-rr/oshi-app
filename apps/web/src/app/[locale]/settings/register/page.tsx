"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RegisterDefaultsPanel } from "@/components/settings/RegisterDefaultsPanel";
import { GuestContextNotice } from "@/components/auth/GuestContextNotice";
import { useRedirectIfSignedOut } from "@/components/auth/BrowserSessionProvider";

export default function RegisterSettingsPage() {
  const t = useTranslations("RegisterDefaults");
  useRedirectIfSignedOut();
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

      <GuestContextNotice variant="localOnly" />
      <RegisterDefaultsPanel />
    </div>
  );
}
