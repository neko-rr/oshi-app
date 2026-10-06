import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { AppEmotionalStatusScreen } from "@/components/feedback/AppEmotionalStatusScreen";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("AppStatus");
  const common = await getTranslations("Common");

  return (
    <AppEmotionalStatusScreen
      kind="not_found"
      title={t("notFoundTitle")}
      body={t("notFoundBody")}
    >
      <Button asChild>
        <Link href="/">{common("home")}</Link>
      </Button>
    </AppEmotionalStatusScreen>
  );
}
