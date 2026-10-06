"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AppEmotionalStatusScreen } from "@/components/feedback/AppEmotionalStatusScreen";
import { Link } from "@/i18n/navigation";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ error, reset }: Props) {
  const t = useTranslations("AppStatus");
  const common = useTranslations("Common");

  useEffect(() => {
    console.error(error.message);
  }, [error]);

  return (
    <AppEmotionalStatusScreen
      kind="error"
      title={t("errorTitle")}
      body={t("errorBody")}
    >
      <Button type="button" onClick={reset}>
        {common("retry")}
      </Button>
      <Button variant="outline" asChild>
        <Link href="/">{common("home")}</Link>
      </Button>
    </AppEmotionalStatusScreen>
  );
}
