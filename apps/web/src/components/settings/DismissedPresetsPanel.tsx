"use client";

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
  if (slots.length === 0) return null;

  return (
    <section className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        非表示にしたプリセット
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        使わない初期タグを隠しています。再表示すると一覧に戻ります。
      </p>
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
              再表示
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
