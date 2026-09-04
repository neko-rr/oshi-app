import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="mt-10 w-full bg-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-foreground">
        <nav
          aria-label={t("aria")}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        >
          <Link
            href="/privacy"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("privacy")}
          </Link>
          <Link
            href="/licenses"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("licenses")}
          </Link>
        </nav>
        <p>© oshi-app</p>
      </div>
    </footer>
  );
}
