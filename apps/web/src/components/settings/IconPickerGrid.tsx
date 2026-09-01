"use client";

import type { LucidePickerOption } from "@oshi/shared";
import { LucideIconBySlug } from "@/components/ui/LucideIconBySlug";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconPickerGridProps = {
  options: readonly LucidePickerOption[];
  value: string;
  onChange: (slug: string) => void;
  ariaLabel: string;
};

/**
 * Lucide アイコンピッカー（LOFT 系・お洒落可愛い）。
 * 遊び心: ホバー／選択時に短い scale。prefers-reduced-motion では無効。
 */
export default function IconPickerGrid({
  options,
  value,
  onChange,
  ariaLabel,
}: IconPickerGridProps) {
  return (
    <div
      className="max-h-52 overflow-y-auto rounded-2xl border border-border bg-muted/30 p-3"
      role="listbox"
      aria-label={ariaLabel}
    >
      <ul className="grid grid-cols-6 gap-2 sm:grid-cols-8">
        {options.map((opt) => {
          const active = opt.slug === value;
          return (
            <li key={opt.slug}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                role="option"
                aria-selected={active}
                aria-label={opt.label_ja}
                title={opt.label_ja}
                onClick={() => onChange(opt.slug)}
                className={cn(
                  "icon-picker-tile size-10 rounded-xl border-border/80 bg-card shadow-none transition-[transform,box-shadow,background-color] duration-[var(--motion-playful)] ease-out",
                  "hover:scale-[1.06] hover:border-primary/40 hover:bg-accent/60",
                  active &&
                    "icon-picker-tile--active scale-[1.08] border-primary bg-accent ring-2 ring-primary/30",
                )}
              >
                <LucideIconBySlug slug={opt.slug} className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
