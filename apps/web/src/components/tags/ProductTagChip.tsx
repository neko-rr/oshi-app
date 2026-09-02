"use client";

import { LucideIconBySlug } from "@/components/ui/LucideIconBySlug";
import {
  LUCIDE_ICON_FALLBACK_CATEGORY,
  LUCIDE_ICON_FALLBACK_STORAGE,
} from "@oshi/shared";
import { cn } from "@/lib/utils";

type ProductTagChipProps = {
  name: string;
  icon?: string | null;
  color?: string | null;
  /** category は色付き、storage は muted */
  variant?: "category" | "storage";
  className?: string;
  compact?: boolean;
};

/** ギャラリー・詳細で使うタグ／収納の視認チップ */
export function ProductTagChip({
  name,
  icon,
  color,
  variant = "category",
  className,
  compact = false,
}: ProductTagChipProps) {
  const fallback =
    variant === "storage"
      ? LUCIDE_ICON_FALLBACK_STORAGE
      : LUCIDE_ICON_FALLBACK_CATEGORY;
  const bg =
    variant === "category" && color && /^#[0-9A-Fa-f]{6}$/.test(color)
      ? color
      : undefined;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-medium",
        bg ? "text-foreground" : "bg-muted/60 text-muted-foreground",
        compact && "px-1.5 py-px",
        className,
      )}
      style={bg ? { backgroundColor: `${bg}33` } : undefined}
      title={name}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md",
          compact ? "size-4" : "size-5",
          bg && "border border-border/60 bg-background/80",
        )}
        style={bg ? { color: bg } : undefined}
        aria-hidden
      >
        <LucideIconBySlug
          slug={icon || fallback}
          className={compact ? "size-2.5" : "size-3"}
        />
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}
