import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import notices from "@/data/generated/third_party_notices.json";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Licenses" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

type NoticePackage = {
  name: string;
  version: string;
  license: string;
  ecosystem: string;
  homepage?: string;
};

type NoticeService = {
  id: string;
  name_ja: string;
  attribution_required: boolean;
  status: string;
  note_ja: string;
  docs_url: string | null;
};

export default async function LicensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Licenses");

  const packages = notices.packages as NoticePackage[];
  const services = notices.services as NoticeService[];
  const generatedAt = notices.generated_at as string;

  return (
    <article className="flex flex-col gap-6 py-6 text-sm leading-relaxed text-foreground">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("generatedAt", { generatedAt })}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("appSectionTitle")}</h2>
        <p>{notices.app_notice_ja}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("ossSectionTitle")}</h2>
        <p className="text-muted-foreground">{t("ossIntro")}</p>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[28rem] border-collapse text-left text-xs sm:text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium">{t("tableName")}</th>
                <th className="px-3 py-2 font-medium">{t("tableVersion")}</th>
                <th className="px-3 py-2 font-medium">{t("tableLicense")}</th>
                <th className="px-3 py-2 font-medium">{t("tableEcosystem")}</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={`${p.ecosystem}:${p.name}`} className="border-t border-border">
                  <td className="px-3 py-2">
                    {p.homepage ? (
                      <a
                        href={p.homepage}
                        className="text-primary underline-offset-4 hover:underline"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {p.name}
                      </a>
                    ) : (
                      p.name
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] sm:text-xs">
                    {p.version || "—"}
                  </td>
                  <td className="px-3 py-2">{p.license}</td>
                  <td className="px-3 py-2">{p.ecosystem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("servicesSectionTitle")}</h2>
        <p className="text-muted-foreground">{t("servicesIntro")}</p>
        {services.map((s) => (
          <div
            key={s.id}
            className="rounded-md border border-border bg-card px-4 py-3 text-card-foreground"
          >
            <h3 className="font-semibold">{s.name_ja}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("statusLabel", { status: s.status })}
              {s.attribution_required
                ? t("attributionRequired")
                : t("attributionNotRequired")}
            </p>
            <p className="mt-2">{s.note_ja}</p>
            {s.docs_url ? (
              <p className="mt-2">
                <a
                  href={s.docs_url}
                  className="text-primary underline-offset-4 hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t("referenceLink")}
                </a>
              </p>
            ) : null}
          </div>
        ))}
      </section>

      <p className="flex flex-wrap gap-4">
        <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
          {t("linkPrivacy")}
        </Link>
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          {t("linkHome")}
        </Link>
      </p>
    </article>
  );
}
