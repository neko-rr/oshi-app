/** 居住地プリセットと日時表示（display_settings と一致）。 */

export type ResidenceContinentId =
  | "asia"
  | "oceania"
  | "americas"
  | "europe"
  | "middle_east_africa"
  | "other";

export type ResidenceRegionId = string;

export type DateFormatModeId = "residence" | "ui_locale" | "iso";

export type CurrencyFormatModeId = "residence" | "ui_locale" | "plain";

export type CurrencyCodeId = string;

/** IANA タイムゾーン ID（API は zoneinfo で検証） */
export type TimezoneId = string;

export type ResidenceRegionOption = {
  id: ResidenceRegionId;
  continent: ResidenceContinentId;
  defaultTimezone: TimezoneId;
  dateLocale: string;
  currencyCode: string;
};

export const DEFAULT_RESIDENCE_REGION: ResidenceRegionId = "jp";
export const DEFAULT_DATE_FORMAT_MODE: DateFormatModeId = "residence";
export const DEFAULT_CURRENCY_FORMAT_MODE: CurrencyFormatModeId = "residence";

/** API ALLOWED_CURRENCY_CODE と揃える */
export const CURRENCY_OPTIONS: readonly CurrencyCodeId[] = [
  "JPY",
  "KRW",
  "TWD",
  "CNY",
  "HKD",
  "SGD",
  "THB",
  "VND",
  "IDR",
  "MYR",
  "PHP",
  "INR",
  "AUD",
  "NZD",
  "USD",
  "CAD",
  "MXN",
  "BRL",
  "ARS",
  "GBP",
  "EUR",
  "CHF",
  "SEK",
  "PLN",
  "RUB",
  "TRY",
  "AED",
  "SAR",
  "EGP",
  "ILS",
  "ZAR",
] as const;

export const RESIDENCE_CONTINENT_ORDER: readonly ResidenceContinentId[] = [
  "asia",
  "oceania",
  "americas",
  "europe",
  "middle_east_africa",
  "other",
] as const;

/** API ALLOWED_RESIDENCE_REGION と揃える */
export const RESIDENCE_REGIONS: readonly ResidenceRegionOption[] = [
  { id: "jp", continent: "asia", defaultTimezone: "Asia/Tokyo", dateLocale: "ja-JP",
    currencyCode: "JPY" },
  { id: "kr", continent: "asia", defaultTimezone: "Asia/Seoul", dateLocale: "ko-KR",
    currencyCode: "KRW" },
  { id: "tw", continent: "asia", defaultTimezone: "Asia/Taipei", dateLocale: "zh-TW",
    currencyCode: "TWD" },
  { id: "cn", continent: "asia", defaultTimezone: "Asia/Shanghai", dateLocale: "zh-CN",
    currencyCode: "CNY" },
  { id: "hk", continent: "asia", defaultTimezone: "Asia/Hong_Kong", dateLocale: "zh-HK",
    currencyCode: "HKD" },
  { id: "sg", continent: "asia", defaultTimezone: "Asia/Singapore", dateLocale: "en-SG",
    currencyCode: "SGD" },
  { id: "th", continent: "asia", defaultTimezone: "Asia/Bangkok", dateLocale: "th-TH",
    currencyCode: "THB" },
  { id: "vn", continent: "asia", defaultTimezone: "Asia/Ho_Chi_Minh", dateLocale: "vi-VN",
    currencyCode: "VND" },
  { id: "id", continent: "asia", defaultTimezone: "Asia/Jakarta", dateLocale: "id-ID",
    currencyCode: "IDR" },
  { id: "my", continent: "asia", defaultTimezone: "Asia/Kuala_Lumpur", dateLocale: "ms-MY",
    currencyCode: "MYR" },
  { id: "ph", continent: "asia", defaultTimezone: "Asia/Manila", dateLocale: "en-PH",
    currencyCode: "PHP" },
  { id: "in", continent: "asia", defaultTimezone: "Asia/Kolkata", dateLocale: "en-IN",
    currencyCode: "INR" },
  {
    id: "au",
    continent: "oceania",
    defaultTimezone: "Australia/Sydney",
    dateLocale: "en-AU",
    currencyCode: "AUD",
  },
  {
    id: "nz",
    continent: "oceania",
    defaultTimezone: "Pacific/Auckland",
    dateLocale: "en-NZ",
    currencyCode: "NZD",
  },
  {
    id: "us_pacific",
    continent: "americas",
    defaultTimezone: "America/Los_Angeles",
    dateLocale: "en-US",
    currencyCode: "USD",
  },
  {
    id: "us_mountain",
    continent: "americas",
    defaultTimezone: "America/Denver",
    dateLocale: "en-US",
    currencyCode: "USD",
  },
  {
    id: "us_central",
    continent: "americas",
    defaultTimezone: "America/Chicago",
    dateLocale: "en-US",
    currencyCode: "USD",
  },
  {
    id: "us_eastern",
    continent: "americas",
    defaultTimezone: "America/New_York",
    dateLocale: "en-US",
    currencyCode: "USD",
  },
  {
    id: "ca_pacific",
    continent: "americas",
    defaultTimezone: "America/Vancouver",
    dateLocale: "en-CA",
    currencyCode: "CAD",
  },
  {
    id: "ca_eastern",
    continent: "americas",
    defaultTimezone: "America/Toronto",
    dateLocale: "en-CA",
    currencyCode: "CAD",
  },
  {
    id: "mx",
    continent: "americas",
    defaultTimezone: "America/Mexico_City",
    dateLocale: "es-MX",
    currencyCode: "MXN",
  },
  {
    id: "br",
    continent: "americas",
    defaultTimezone: "America/Sao_Paulo",
    dateLocale: "pt-BR",
    currencyCode: "BRL",
  },
  {
    id: "ar",
    continent: "americas",
    defaultTimezone: "America/Argentina/Buenos_Aires",
    dateLocale: "es-AR",
    currencyCode: "ARS",
  },
  { id: "uk", continent: "europe", defaultTimezone: "Europe/London", dateLocale: "en-GB",
    currencyCode: "GBP" },
  { id: "ie", continent: "europe", defaultTimezone: "Europe/Dublin", dateLocale: "en-IE",
    currencyCode: "EUR" },
  { id: "de", continent: "europe", defaultTimezone: "Europe/Berlin", dateLocale: "de-DE",
    currencyCode: "EUR" },
  { id: "fr", continent: "europe", defaultTimezone: "Europe/Paris", dateLocale: "fr-FR",
    currencyCode: "EUR" },
  { id: "it", continent: "europe", defaultTimezone: "Europe/Rome", dateLocale: "it-IT",
    currencyCode: "EUR" },
  { id: "es", continent: "europe", defaultTimezone: "Europe/Madrid", dateLocale: "es-ES",
    currencyCode: "EUR" },
  {
    id: "nl",
    continent: "europe",
    defaultTimezone: "Europe/Amsterdam",
    dateLocale: "nl-NL",
    currencyCode: "EUR",
  },
  {
    id: "se",
    continent: "europe",
    defaultTimezone: "Europe/Stockholm",
    dateLocale: "sv-SE",
    currencyCode: "SEK",
  },
  { id: "pl", continent: "europe", defaultTimezone: "Europe/Warsaw", dateLocale: "pl-PL",
    currencyCode: "PLN" },
  { id: "ch", continent: "europe", defaultTimezone: "Europe/Zurich", dateLocale: "de-CH",
    currencyCode: "CHF" },
  { id: "pt", continent: "europe", defaultTimezone: "Europe/Lisbon", dateLocale: "pt-PT",
    currencyCode: "EUR" },
  { id: "ru", continent: "europe", defaultTimezone: "Europe/Moscow", dateLocale: "ru-RU",
    currencyCode: "RUB" },
  { id: "tr", continent: "europe", defaultTimezone: "Europe/Istanbul", dateLocale: "tr-TR",
    currencyCode: "TRY" },
  {
    id: "ae",
    continent: "middle_east_africa",
    defaultTimezone: "Asia/Dubai",
    dateLocale: "ar-AE",
    currencyCode: "AED",
  },
  {
    id: "sa",
    continent: "middle_east_africa",
    defaultTimezone: "Asia/Riyadh",
    dateLocale: "ar-SA",
    currencyCode: "SAR",
  },
  {
    id: "eg",
    continent: "middle_east_africa",
    defaultTimezone: "Africa/Cairo",
    dateLocale: "ar-EG",
    currencyCode: "EGP",
  },
  {
    id: "il",
    continent: "middle_east_africa",
    defaultTimezone: "Asia/Jerusalem",
    dateLocale: "he-IL",
    currencyCode: "ILS",
  },
  {
    id: "za",
    continent: "middle_east_africa",
    defaultTimezone: "Africa/Johannesburg",
    dateLocale: "en-ZA",
    currencyCode: "ZAR",
  },
  { id: "other", continent: "other", defaultTimezone: "UTC", dateLocale: "en-US",
    currencyCode: "USD" },
] as const;

/** Intl.supportedValuesOf が使えない環境向けの最低限フォールバック */
const TIMEZONE_FALLBACK: readonly string[] = [
  "UTC",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Taipei",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Cairo",
  "Africa/Johannesburg",
];

const REGION_BY_ID = new Map(RESIDENCE_REGIONS.map((r) => [r.id, r]));

const IANA_PATTERN = /^(UTC|[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)+)$/;

export function findResidenceRegion(
  id: string | null | undefined,
): ResidenceRegionOption {
  return REGION_BY_ID.get(id ?? "") ?? RESIDENCE_REGIONS[0];
}

export function sanitizeResidenceRegion(raw: unknown): ResidenceRegionId {
  if (typeof raw === "string" && REGION_BY_ID.has(raw)) {
    return raw;
  }
  return DEFAULT_RESIDENCE_REGION;
}

export function sanitizeDateFormatMode(raw: unknown): DateFormatModeId {
  if (raw === "residence" || raw === "ui_locale" || raw === "iso") return raw;
  return DEFAULT_DATE_FORMAT_MODE;
}

export function sanitizeCurrencyFormatMode(raw: unknown): CurrencyFormatModeId {
  if (raw === "residence" || raw === "ui_locale" || raw === "plain") return raw;
  return DEFAULT_CURRENCY_FORMAT_MODE;
}

export function sanitizeCurrencyCodeOverride(raw: unknown): CurrencyCodeId | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  if ((CURRENCY_OPTIONS as readonly string[]).includes(code)) return code;
  return null;
}

export function effectiveCurrencyCode(
  region: ResidenceRegionId,
  override: CurrencyCodeId | null,
): CurrencyCodeId {
  if (override) return override;
  return findResidenceRegion(region).currencyCode;
}

/** 実行環境の IANA 一覧（ソート済み） */
export function listIanaTimezones(): string[] {
  try {
    const intlWithZones = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof intlWithZones.supportedValuesOf === "function") {
      const zones = intlWithZones.supportedValuesOf("timeZone");
      if (Array.isArray(zones) && zones.length > 0) {
        const set = new Set(zones);
        set.add("UTC");
        return Array.from(set).sort((a, b) => a.localeCompare(b));
      }
    }
  } catch {
    // fall through
  }
  return [...TIMEZONE_FALLBACK];
}

export function sanitizeTimezoneOverride(raw: unknown): TimezoneId | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!IANA_PATTERN.test(value)) return null;
  const known = listIanaTimezones();
  if (known.includes(value)) return value;
  // supportedValuesOf 欠落時でも居住地デフォルトは通す
  if (TIMEZONE_FALLBACK.includes(value)) return value;
  return null;
}

export function effectiveTimezone(
  region: ResidenceRegionId,
  override: TimezoneId | null,
): TimezoneId {
  if (override) return override;
  return findResidenceRegion(region).defaultTimezone;
}

export type FormatAppDateTimePrefs = {
  residence_region: ResidenceRegionId;
  timezone_override: TimezoneId | null;
  date_format_mode: DateFormatModeId;
};

/**
 * 登録日などの表示用。無効な入力は空文字。
 * iso モードは暦日を YYYY-MM-DD（TZ 反映後）で出す。
 */
export function formatAppDateTime(
  value: string | Date | null | undefined,
  prefs: FormatAppDateTimePrefs,
  uiLocale: string,
  options?: { timeStyle?: "short" | "medium" | null },
): string {
  if (value == null || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    // 日付だけの文字列（YYYY-MM-DD）はそのまま返す
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      return value.trim();
    }
    return String(value);
  }

  const timeZone = effectiveTimezone(
    prefs.residence_region,
    prefs.timezone_override,
  );
  const region = findResidenceRegion(prefs.residence_region);
  const includeTime =
    options?.timeStyle !== null && options?.timeStyle !== undefined
      ? true
      : options?.timeStyle === undefined
        ? !/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())
        : Boolean(options.timeStyle);

  if (prefs.date_format_mode === "iso") {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...(includeTime
        ? { hour: "2-digit", minute: "2-digit", hour12: false }
        : {}),
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "";
    const day = `${get("year")}-${get("month")}-${get("day")}`;
    if (!includeTime) return day;
    return `${day} ${get("hour")}:${get("minute")}`;
  }

  const locale =
    prefs.date_format_mode === "ui_locale"
      ? uiLocale === "en"
        ? "en-US"
        : "ja-JP"
      : region.dateLocale;

  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(includeTime
        ? {
            hour: "numeric",
            minute: "2-digit",
          }
        : {}),
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/** 設定プレビュー用の固定サンプル時刻（UTC） */
export const PREVIEW_SAMPLE_INSTANT = "2026-09-03T07:30:00.000Z";

/** 金額プレビュー用サンプル（整数・換算なし） */
export const PREVIEW_SAMPLE_AMOUNT = 12345;

export type FormatAppMoneyPrefs = {
  residence_region: ResidenceRegionId;
  currency_code_override: CurrencyCodeId | null;
  currency_format_mode: CurrencyFormatModeId;
  /** 製品の記録通貨（優先。なければ display_settings） */
  record_currency_code?: CurrencyCodeId | null;
};

/**
 * 購入価格などの表示用。整数をそのまま表示（為替換算なし）。
 * plain は桁区切りのみ。それ以外は通貨スタイル。
 * 通貨優先順: record_currency_code → currency_code_override → 居住地既定。
 */
export function formatAppMoney(
  value: number | string | null | undefined,
  prefs: FormatAppMoneyPrefs,
  uiLocale: string,
): string {
  if (value == null || value === "") return "";
  const amount = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(amount)) return String(value);

  const region = findResidenceRegion(prefs.residence_region);
  const record = sanitizeCurrencyCodeOverride(prefs.record_currency_code ?? null);
  const currency =
    record ??
    effectiveCurrencyCode(prefs.residence_region, prefs.currency_code_override);
  const locale =
    prefs.currency_format_mode === "ui_locale"
      ? uiLocale === "en"
        ? "en-US"
        : "ja-JP"
      : region.dateLocale;

  try {
    if (prefs.currency_format_mode === "plain") {
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

