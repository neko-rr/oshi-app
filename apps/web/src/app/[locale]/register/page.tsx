import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterWizard } from "@/components/register/RegisterWizard";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Register");

  return (
    <div className="stack-density-lg">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>
      <RegisterWizard />
    </div>
  );
}
