"use client";

import { THEME_OPTIONS, useTheme } from "@/hooks/useTheme";
import { themeSwatchRimClass } from "@/lib/themes/catalog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * テーマ色ピッカー（Design Lab B 採用）。
 * 枠黒＝ライト / 枠白＝ダーク。塗りはカタログのスウォッチのみ。
 */
export default function ThemePicker() {
  const { themeId, setTheme, isSyncing, current } = useTheme();

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex min-h-[5.5rem] items-end rounded-2xl border border-border bg-muted/40 p-3"
        aria-hidden
      >
        <span className="rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-card-foreground shadow-sm">
          {current.label}
        </span>
      </div>

      <ul
        className="flex flex-wrap gap-3"
        role="listbox"
        aria-label="テーマ色"
      >
        {THEME_OPTIONS.map((t) => {
          const active = t.id === themeId;
          const rim = themeSwatchRimClass(t.scheme);
          return (
            <li key={t.id}>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                role="option"
                aria-selected={active}
                aria-label={`${t.label}（${t.scheme === "dark" ? "ダーク" : "ライト"}）`}
                title={`${t.label} · ${t.scheme === "dark" ? "枠白＝ダーク" : "枠黒＝ライト"}`}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "size-11 rounded-full border-2 p-0 shadow-none hover:bg-transparent",
                  rim,
                  active &&
                    "scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
                style={{ backgroundColor: t.swatch }}
              />
            </li>
          );
        })}
      </ul>

      <p className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-full border-2 border-zinc-900 bg-primary"
            aria-hidden
          />
          枠黒＝ライト
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-full border-2 border-white bg-primary shadow-[0_0_0_1px_rgb(0_0_0_/_0.25)]"
            aria-hidden
          />
          枠白＝ダーク
        </span>
      </p>

      <p className="text-xs text-muted-foreground">
        {isSyncing ? "同期中…" : `選択中: ${current.label}`}
      </p>
    </div>
  );
}
