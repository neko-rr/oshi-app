"use client";

import { ProductTagChip } from "@/components/tags/ProductTagChip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TagChipOption = {
  id: number;
  name: string;
  icon?: string | null;
  color?: string | null;
};

type TagChipPickerProps = {
  label: string;
  options: TagChipOption[];
  value: number | null;
  onChange: (id: number | null) => void;
  variant: "category" | "storage";
  noneLabel?: string;
};

/** 製品詳細向け: アイコン付きチップでタグを選ぶ（ネイティブ select より視認性が高い） */
export function TagChipPicker({
  label,
  options,
  value,
  onChange,
  variant,
  noneLabel = "未設定",
}: TagChipPickerProps) {
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label={label}
      >
        <Button
          type="button"
          variant={value === null ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-auto rounded-full px-3 py-1.5 text-xs font-normal",
            value === null && "ring-2 ring-primary ring-offset-2",
          )}
          onClick={() => onChange(null)}
          aria-pressed={value === null}
        >
          {noneLabel}
        </Button>
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <Button
              key={opt.id}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-auto max-w-full rounded-full border-border p-0.5 pr-2",
                selected && "ring-2 ring-primary ring-offset-2",
              )}
              onClick={() => onChange(opt.id)}
              aria-pressed={selected}
            >
              <ProductTagChip
                name={opt.name}
                icon={opt.icon}
                color={opt.color}
                variant={variant}
                compact
                className="border-0 bg-transparent px-1"
              />
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}
