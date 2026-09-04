"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * 見た目設定内の言語切替。URL プレフィックスと Cookie を更新する。
 */
export function LocaleSwitcher() {
  const t = useTranslations("Appearance");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const options = [
    { id: "ja" as const, label: t("langJa") },
    { id: "en" as const, label: t("langEn") },
  ];

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground">
        {t("languageTitle")}
      </legend>
      <p className="text-xs text-muted-foreground">{t("languageHint")}</p>
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label={t("languageTitle")}
      >
        {options.map((opt) => {
          const active = opt.id === locale;
          return (
            <Button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              variant={active ? "default" : "outline"}
              className={cn("min-h-10 px-3 py-2 text-sm")}
              onClick={() => {
                if (opt.id === locale) return;
                if (!routing.locales.includes(opt.id)) return;
                router.replace(pathname, { locale: opt.id });
              }}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}
