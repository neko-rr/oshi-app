"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMascot } from "@/hooks/useMascot";
import {
  MASCOT_CATALOG,
  mascotSceneUrl,
  type MascotId,
} from "@/lib/mascotCatalog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Option = {
  id: MascotId;
  label: string;
  previewSrc: string | null;
};

/**
 * 見た目設定: マスコット選択（全候補＋無し）。端末に保存。
 */
export function MascotPickerPanel() {
  const t = useTranslations("MascotSettings");
  const { mascotId, setMascotId } = useMascot();

  const options: Option[] = [
    { id: "none", label: t("none"), previewSrc: null },
    ...MASCOT_CATALOG.map((item) => ({
      id: item.id as MascotId,
      label: item.name_ja,
      previewSrc: mascotSceneUrl(item.id, item.preview_pose),
    })),
  ];

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">{t("legend")}</legend>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        role="radiogroup"
        aria-label={t("legend")}
      >
        {options.map((opt) => {
          const active = mascotId === opt.id;
          return (
            <Button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              variant={active ? "default" : "outline"}
              onClick={() => setMascotId(opt.id)}
              className={cn(
                "flex h-auto min-h-24 flex-col items-center gap-2 px-2 py-3 text-sm",
                active && "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
            >
              <span
                className={cn(
                  "relative flex size-16 items-center justify-center overflow-hidden rounded-xl bg-muted/60",
                  !opt.previewSrc && "border border-dashed border-border",
                )}
              >
                {opt.previewSrc ? (
                  <Image
                    src={opt.previewSrc}
                    alt=""
                    width={64}
                    height={64}
                    className="size-16 object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="px-1 text-center text-[10px] leading-tight text-muted-foreground">
                    {t("nonePreview")}
                  </span>
                )}
              </span>
              <span className="text-center leading-snug">{opt.label}</span>
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{t("localHint")}</p>
    </fieldset>
  );
}
