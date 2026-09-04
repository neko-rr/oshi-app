"use client";

import { useLocale } from "next-intl";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { formatAppDateTime } from "@/lib/residencePrefs";

type Props = {
  value: string | null | undefined;
  fallback?: string;
  className?: string;
};

/** 居住地・日時設定に従う日付表示 */
export function FormattedAppDate({ value, fallback = "", className }: Props) {
  const uiLocale = useLocale();
  const { residenceRegion, timezoneOverride, dateFormatMode } =
    useDisplaySettings();
  const text =
    formatAppDateTime(
      value,
      {
        residence_region: residenceRegion,
        timezone_override: timezoneOverride,
        date_format_mode: dateFormatMode,
      },
      uiLocale,
    ) || fallback;
  if (!text) return null;
  return <span className={className}>{text}</span>;
}
