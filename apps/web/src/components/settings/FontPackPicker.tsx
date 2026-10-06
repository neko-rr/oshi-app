"use client";

import { useTranslations } from "next-intl";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { FONT_PACK_IDS, type FontPackId } from "@/lib/displayPrefs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * 文字パック選択。和文＋欧文はパック内で固定。テーマ色とは独立。
 */
export function FontPackPicker() {
  const t = useTranslations("DisplaySettings");
  const { fontPack, setFontPack, isSyncing } = useDisplaySettings();

  return (
    <div className="flex flex-col gap-3">
      <fieldset>
        <legend className="text-sm font-medium text-foreground">
          {t("fontPack")}
        </legend>
        <p className="mt-1 text-xs text-muted-foreground">{t("fontPackHint")}</p>
        <div
          className="mt-3 grid gap-2 sm:grid-cols-2"
          role="radiogroup"
          aria-label={t("fontPack")}
        >
          {FONT_PACK_IDS.map((id) => {
            const active = id === fontPack;
            return (
              <Button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                variant="outline"
                onClick={() => setFontPack(id as FontPackId)}
                className={cn(
                  "h-auto min-h-11 flex-col items-stretch gap-1 whitespace-normal bg-card px-3 py-3 text-left text-card-foreground",
                  active && "border-primary ring-2 ring-primary/40",
                )}
              >
                <span className="text-sm font-semibold">
                  {t(`fontPackOptions.${id}` as "fontPackOptions.clean")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(`fontPackHints.${id}` as "fontPackHints.clean")}
                </span>
                <span
                  data-font-preview={id}
                  data-font-preview-role="heading"
                  className="mt-1 text-base font-semibold tracking-tight"
                >
                  {t("fontPackSampleHeading")}
                </span>
                <span data-font-preview={id} className="text-sm">
                  {t("fontPackSampleBody")}
                </span>
              </Button>
            );
          })}
        </div>
      </fieldset>
      <p className="text-xs text-muted-foreground">
        {isSyncing ? t("syncing") : t("autoSave")}
      </p>
    </div>
  );
}
