import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { UpgradeAccountForm } from "@/components/auth/UpgradeAccountForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "GuestUpgrade" });
  return { title: t("metaTitle") };
}

export default async function UpgradeAccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("GuestUpgrade");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 py-8">
      <Link
        href="/"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {t("backHome")}
      </Link>
      <UpgradeAccountForm />
    </div>
  );
}
