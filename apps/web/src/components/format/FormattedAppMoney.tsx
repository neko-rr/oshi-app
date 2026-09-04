"use client";

import { useLocale } from "next-intl";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { formatAppMoney } from "@/lib/residencePrefs";

type Props = {
  value: number | string | null | undefined;
  /** 製品の記録通貨（ISO）。なければ表示設定 */
  currencyCode?: string | null;
  fallback?: string;
  className?: string;
};

/** 記録通貨優先・なければ display_settings の金額表示（換算なし） */
export function FormattedAppMoney({
  value,
  currencyCode = null,
  fallback = "",
  className,
}: Props) {
  const uiLocale = useLocale();
  const { residenceRegion, currencyCodeOverride, currencyFormatMode } =
    useDisplaySettings();
  const text =
    formatAppMoney(
      value,
      {
        residence_region: residenceRegion,
        currency_code_override: currencyCodeOverride,
        currency_format_mode: currencyFormatMode,
        record_currency_code: currencyCode,
      },
      uiLocale,
    ) || fallback;
  if (!text) return null;
  return <span className={className}>{text}</span>;
}
