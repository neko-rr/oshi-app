import { Button } from "@/components/ui/button";
import { AppEmotionalStatusScreen } from "@/components/feedback/AppEmotionalStatusScreen";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("AuthError");
  const common = await getTranslations("Common");
  const sp = await searchParams;
  const body = sp?.error
    ? t("codeError", { error: sp.error })
    : t("unspecified");

  return (
    <AppEmotionalStatusScreen kind="error" title={t("title")} body={body}>
      <Button asChild>
        <Link href="/">{common("home")}</Link>
      </Button>
    </AppEmotionalStatusScreen>
  );
}

