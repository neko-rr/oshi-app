"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  CURRENCY_OPTIONS,
  PREVIEW_SAMPLE_AMOUNT,
  PREVIEW_SAMPLE_INSTANT,
  RESIDENCE_CONTINENT_ORDER,
  RESIDENCE_REGIONS,
  findResidenceRegion,
  formatAppDateTime,
  formatAppMoney,
  listIanaTimezones,
  type CurrencyFormatModeId,
  type DateFormatModeId,
  type ResidenceContinentId,
  type ResidenceRegionId,
} from "@/lib/residencePrefs";

const FORMAT_MODES: DateFormatModeId[] = ["residence", "ui_locale", "iso"];
const CURRENCY_FORMAT_MODES: CurrencyFormatModeId[] = [
  "residence",
  "ui_locale",
  "plain",
];

/**
 * 居住地・日時・金額表示。検索付きコンボ＋プレビュー＋折りたたみ個別設定。
 */
export function ResidenceSettingsPanel() {
  const t = useTranslations("Residence");
  const tCommon = useTranslations("Common");
  const uiLocale = useLocale();
  const {
    residenceRegion,
    timezoneOverride,
    dateFormatMode,
    currencyCodeOverride,
    currencyFormatMode,
    setResidenceRegion,
    setTimezoneOverride,
    setDateFormatMode,
    setCurrencyCodeOverride,
    setCurrencyFormatMode,
    isSyncing,
  } = useDisplaySettings();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const datePreview = formatAppDateTime(
    PREVIEW_SAMPLE_INSTANT,
    {
      residence_region: residenceRegion,
      timezone_override: timezoneOverride,
      date_format_mode: dateFormatMode,
    },
    uiLocale,
  );

  const moneyPreview = formatAppMoney(
    PREVIEW_SAMPLE_AMOUNT,
    {
      residence_region: residenceRegion,
      currency_code_override: currencyCodeOverride,
      currency_format_mode: currencyFormatMode,
    },
    uiLocale,
  );

  const useCustomTz = timezoneOverride !== null;
  const useCustomCurrency = currencyCodeOverride !== null;

  const regionOptions = useMemo(() => {
    const continentLabel = (id: ResidenceContinentId) => t(`continents.${id}`);
    const ordered = RESIDENCE_CONTINENT_ORDER.flatMap((continent) =>
      RESIDENCE_REGIONS.filter((r) => r.continent === continent),
    );
    return ordered.map((region) => ({
      value: region.id,
      label: t(`regions.${region.id}`),
      keywords: `${region.defaultTimezone} ${region.currencyCode} ${region.id}`,
      group: continentLabel(region.continent),
    }));
  }, [t]);

  const timezoneOptions = useMemo(() => {
    return listIanaTimezones().map((tz) => {
      const slash = tz.indexOf("/");
      const group = slash > 0 ? tz.slice(0, slash) : t("tzGroupOther");
      return {
        value: tz,
        label: tz,
        keywords: tz.replaceAll("_", " "),
        group,
      };
    });
  }, [t]);

  const currencyOptions = useMemo(
    () =>
      CURRENCY_OPTIONS.map((code) => ({
        value: code,
        label: t(`currencies.${code}`),
        keywords: code,
      })),
    [t],
  );

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          {t("regionLegend")}
        </legend>
        <p className="text-xs text-muted-foreground">{t("regionHint")}</p>
        <SearchableSelect
          aria-label={t("regionLegend")}
          placeholder={t("regionSearchPlaceholder")}
          emptyLabel={t("searchEmpty")}
          options={regionOptions}
          value={residenceRegion}
          onChange={(id) => setResidenceRegion(id as ResidenceRegionId)}
        />
      </fieldset>

      <div
        className="rounded-md border border-border bg-card px-4 py-density text-card-foreground"
        aria-live="polite"
      >
        <p className="text-xs font-medium text-muted-foreground">
          {t("previewLabel")}
        </p>
        <p className="mt-1 text-base font-medium tracking-tight">{datePreview}</p>
        <p className="mt-2 text-base font-medium tracking-tight">{moneyPreview}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("previewHint")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("currencyNoFxHint")}</p>
      </div>

      <div className="rounded-md border border-border">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between gap-2 rounded-none px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/40"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          <span>{t("advancedTitle")}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {advancedOpen ? t("advancedHide") : t("advancedShow")}
          </span>
        </Button>
        {advancedOpen ? (
          <div className="flex flex-col gap-5 border-t border-border px-4 py-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">{t("tzLegend")}</legend>
              <p className="text-xs text-muted-foreground">{t("tzHint")}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={!useCustomTz ? "default" : "outline"}
                  onClick={() => setTimezoneOverride(null)}
                  className="min-h-10 text-sm"
                >
                  {t("tzFollowResidence")}
                </Button>
                <Button
                  type="button"
                  variant={useCustomTz ? "default" : "outline"}
                  onClick={() =>
                    setTimezoneOverride(
                      timezoneOverride ??
                        findResidenceRegion(residenceRegion).defaultTimezone,
                    )
                  }
                  className="min-h-10 text-sm"
                >
                  {t("tzCustom")}
                </Button>
              </div>
              {useCustomTz ? (
                <SearchableSelect
                  aria-label={t("tzSelectAria")}
                  placeholder={t("tzSearchPlaceholder")}
                  emptyLabel={t("searchEmpty")}
                  options={timezoneOptions}
                  value={timezoneOverride ?? ""}
                  onChange={(tz) => setTimezoneOverride(tz)}
                />
              ) : null}
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">{t("formatLegend")}</legend>
              <p className="text-xs text-muted-foreground">{t("formatHint")}</p>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label={t("formatLegend")}
              >
                {FORMAT_MODES.map((mode) => {
                  const active = mode === dateFormatMode;
                  return (
                    <Button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      variant={active ? "default" : "outline"}
                      onClick={() => setDateFormatMode(mode)}
                      className="min-h-10 px-3 text-sm"
                    >
                      {t(`formatModes.${mode}`)}
                    </Button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">{t("currencyLegend")}</legend>
              <p className="text-xs text-muted-foreground">{t("currencyHint")}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={!useCustomCurrency ? "default" : "outline"}
                  onClick={() => setCurrencyCodeOverride(null)}
                  className="min-h-10 text-sm"
                >
                  {t("currencyFollowResidence")}
                </Button>
                <Button
                  type="button"
                  variant={useCustomCurrency ? "default" : "outline"}
                  onClick={() =>
                    setCurrencyCodeOverride(
                      currencyCodeOverride ??
                        findResidenceRegion(residenceRegion).currencyCode,
                    )
                  }
                  className="min-h-10 text-sm"
                >
                  {t("currencyCustom")}
                </Button>
              </div>
              {useCustomCurrency ? (
                <SearchableSelect
                  aria-label={t("currencySelectAria")}
                  placeholder={t("currencySearchPlaceholder")}
                  emptyLabel={t("searchEmpty")}
                  options={currencyOptions}
                  value={currencyCodeOverride ?? ""}
                  onChange={(code) => setCurrencyCodeOverride(code)}
                />
              ) : null}
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">
                {t("currencyFormatLegend")}
              </legend>
              <p className="text-xs text-muted-foreground">
                {t("currencyFormatHint")}
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label={t("currencyFormatLegend")}
              >
                {CURRENCY_FORMAT_MODES.map((mode) => {
                  const active = mode === currencyFormatMode;
                  return (
                    <Button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      variant={active ? "default" : "outline"}
                      onClick={() => setCurrencyFormatMode(mode)}
                      className="min-h-10 px-3 text-sm"
                    >
                      {t(`currencyFormatModes.${mode}`)}
                    </Button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {isSyncing ? tCommon("syncing") : t("autoSave")}
      </p>
    </div>
  );
}
