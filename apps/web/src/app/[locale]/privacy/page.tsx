import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");

  return (
    <article className="flex flex-col gap-6 py-6 text-sm leading-relaxed text-foreground">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("lastUpdated")}</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("overviewTitle")}</h2>
        <p>{t("overviewBody")}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("collectTitle")}</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("collectItemAccount")}</li>
          <li>{t("collectItemGoods")}</li>
          <li>{t("collectItemPhotos")}</li>
          <li>{t("collectItemLogs")}</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("purposeTitle")}</h2>
        <p>{t("purposeBody")}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("photosTitle")}</h2>
        <p>
          {t.rich("photosBody", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("isolationTitle")}</h2>
        <p>
          {t.rich("isolationBody", {
            code: (chunks) => (
              <code className="rounded bg-muted px-1">{chunks}</code>
            ),
          })}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("contactTitle")}</h2>
        <p>{t("contactBody")}</p>
      </section>

      <p className="flex flex-wrap gap-4">
        <Link href="/licenses" className="text-primary underline-offset-4 hover:underline">
          {t("linkLicenses")}
        </Link>
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          {t("linkHome")}
        </Link>
      </p>
    </article>
  );
}
