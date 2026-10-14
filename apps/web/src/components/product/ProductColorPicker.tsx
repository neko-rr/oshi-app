"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  PRODUCT_COLOR_CODES,
  PRODUCT_COLOR_HEX,
  isProductColorCode,
  type ProductColorCode,
} from "@/lib/productColor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  selected: Iterable<string>;
  onToggle: (code: ProductColorCode) => void;
  legend: string;
  hint?: string | null;
};

/**
 * グッズの色。名前で絞れる見本。選んだ色は丸を出す。
 */
export function ProductColorPicker({
  selected,
  onToggle,
  legend,
  hint = null,
}: Props) {
  const t = useTranslations("ProductColor");
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => {
    const set = new Set<string>();
    for (const code of selected) set.add(code);
    return set;
  }, [selected]);
  const needle = query.trim().toLowerCase();
  const visible = PRODUCT_COLOR_CODES.filter((code) => {
    if (!needle) return true;
    if (selectedSet.has(code)) return true;
    return t(code).toLowerCase().includes(needle);
  });

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
      />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="group">
        {visible.map((code) => {
          const active = selectedSet.has(code);
          return (
            <Button
              key={code}
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={active}
              onClick={() => onToggle(code)}
              className={cn(
                "h-auto min-h-11 justify-start rounded-full px-2 py-1 text-left text-xs font-normal",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <span
                className="inline-block size-3.5 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: PRODUCT_COLOR_HEX[code] }}
                aria-hidden
              />
              <span className="truncate">{t(code)}</span>
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ProductColorDots({
  codes,
  labelFor,
}: {
  codes: string[] | null | undefined;
  labelFor: (code: ProductColorCode) => string;
}) {
  const shown = (codes ?? []).filter(isProductColorCode);
  if (shown.length === 0) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-1" aria-hidden>
      {shown.map((code) => (
        <span
          key={code}
          title={labelFor(code)}
          className="inline-block size-2.5 rounded-full border border-border"
          style={{ backgroundColor: PRODUCT_COLOR_HEX[code] }}
        />
      ))}
    </span>
  );
}
