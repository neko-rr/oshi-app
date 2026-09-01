"use client";

import type { LucideIcon } from "@/lib/icons";
import * as IconComponents from "@/lib/icons";
import { slugToPascal } from "@oshi/shared";

type LucideIconBySlugProps = {
  slug: string;
  className?: string;
  fallback?: LucideIcon;
};

/** Lucide slug（kebab-case）からアイコンを描画 */
export function LucideIconBySlug({
  slug,
  className,
  fallback: Fallback = IconComponents.Tag,
}: LucideIconBySlugProps) {
  const pascal = slugToPascal(slug);
  const Icon = (IconComponents as Record<string, LucideIcon | undefined>)[pascal];
  const Resolved = Icon ?? Fallback;
  return <Resolved className={className} aria-hidden />;
}
