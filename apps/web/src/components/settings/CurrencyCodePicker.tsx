"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Label } from "@/components/ui/label";
import { CURRENCY_OPTIONS } from "@/lib/residencePrefs";

type Props = {
  value: string;
  onChange: (code: string) => void;
  id?: string;
};

/** 購入価格の記録通貨（ISO）選択 */
export function CurrencyCodePicker({ value, onChange, id }: Props) {
  const t = useTranslations("Residence");
  const options = useMemo(
    () =>
      CURRENCY_OPTIONS.map((code) => ({
        value: code,
        label: t(`currencies.${code}`),
        keywords: code,
      })),
    [t],
  );

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{t("productCurrencyLegend")}</Label>
      <p className="text-xs text-muted-foreground">{t("productCurrencyHint")}</p>
      <SearchableSelect
        aria-label={t("productCurrencyLegend")}
        placeholder={t("currencySearchPlaceholder")}
        emptyLabel={t("searchEmpty")}
        options={options}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
