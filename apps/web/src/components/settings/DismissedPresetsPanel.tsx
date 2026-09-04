"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type DismissedPresetsPanelProps = {
  slots: number[];
  labelForSlot: (slot: number) => string;
  onRestore: (slot: number) => void;
  busy?: boolean;
};

/** 非表示にしたプリセットをまとめて再表示できるパネル */
export function DismissedPresetsPanel({
  slots,
  labelForSlot,
  onRestore,
  busy = false,
}: DismissedPresetsPanelProps) {
  const t = useTranslations("TagPresets");
  const tCommon = useTranslations("Common");

  if (slots.length === 0) return null;

  return (
    <section className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        {t("dismissedTitle")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("dismissedBody")}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {slots.map((slot) => (
          <li
            key={slot}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <span>{labelForSlot(slot)}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onRestore(slot)}
            >
              {tCommon("showAgain")}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
