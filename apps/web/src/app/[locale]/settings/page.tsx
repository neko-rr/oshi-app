"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogoutButton } from "@/components/logout-button";
import { GuestContextNotice } from "@/components/auth/GuestContextNotice";
import { useRedirectIfSignedOut } from "@/components/auth/BrowserSessionProvider";
import { NavLinkPendingOverlay } from "@/components/layout/NavLinkPendingHint";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const t = useTranslations("SettingsIndex");
  useRedirectIfSignedOut();

  const hubSections = [
    {
      title: t("sectionExplore"),
      links: [{ href: "/dashboard", label: t("dashboard") }],
    },
    {
      title: t("appearance"),
      links: [{ href: "/settings/theme", label: t("appearanceHint") }],
    },
    {
      title: t("sectionRegister"),
      links: [{ href: "/settings/register", label: t("registerDefaults") }],
    },
    {
      title: t("sectionTags"),
      links: [
        { href: "/settings/color-tags", label: t("colorTags") },
        { href: "/settings/category-tags", label: t("categoryTags") },
        { href: "/settings/storage-locations", label: t("storageLocations") },
      ],
    },
    {
      title: t("sectionAccount"),
      links: [
        { href: "/me", label: t("accountInfo") },
        { href: "/auth/update-password", label: t("changePassword") },
      ],
    },
    {
      title: t("sectionData"),
      links: [
        { href: "/settings/export", label: t("dataExport") },
        { href: "/settings/delete-account", label: t("deleteAccount") },
      ],
    },
    {
      title: t("sectionLegal"),
      links: [
        { href: "/privacy", label: t("privacy") },
        { href: "/licenses", label: t("licenses") },
      ],
    },
  ] as const;

  return (
    <div className="stack-density-lg">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <GuestContextNotice variant="localOnly" />

      {hubSections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {section.title}
          </h2>
          <ul className="flex flex-col gap-y-density">
            {section.links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="relative block min-h-11 rounded-md border border-border bg-card px-4 py-density text-card-foreground transition-colors hover:bg-muted/40 active:bg-muted"
                >
                  <NavLinkPendingOverlay />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {process.env.NODE_ENV === "development" ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("sectionDev")}
          </h2>
          <ul className="flex flex-col gap-2">
            <li>
              <Link
                href="/dev/design-lab"
                className="relative block min-h-11 rounded-md border border-dashed border-border bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-muted/40 active:bg-muted"
              >
                <NavLinkPendingOverlay />
                {t("designLab")}
              </Link>
            </li>
            <li>
              <Link
                href="/dev/design-lab/theme-colors"
                className="relative block min-h-11 rounded-md border border-dashed border-border bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-muted/40 active:bg-muted"
              >
                <NavLinkPendingOverlay />
                {t("designLabThemeColors")}
              </Link>
            </li>
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <LogoutButton variant="destructive" />
        <Button asChild type="button" variant="outline">
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    </div>
  );
}
