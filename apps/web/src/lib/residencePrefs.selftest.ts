/**
 * residencePrefs / formatAppDateTime の自己検査。
 * 実行: node --experimental-strip-types apps/web/src/lib/residencePrefs.selftest.ts
 */
import assert from "node:assert/strict";
import {
  DEFAULT_RESIDENCE_REGION,
  effectiveCurrencyCode,
  effectiveTimezone,
  formatAppDateTime,
  formatAppMoney,
  listIanaTimezones,
  sanitizeCurrencyCodeOverride,
  sanitizeCurrencyFormatMode,
  sanitizeDateFormatMode,
  sanitizeResidenceRegion,
  sanitizeTimezoneOverride,
} from "./residencePrefs.ts";

assert.equal(sanitizeResidenceRegion("jp"), "jp");
assert.equal(sanitizeResidenceRegion("de"), "de");
assert.equal(sanitizeResidenceRegion("nope"), DEFAULT_RESIDENCE_REGION);
assert.equal(sanitizeDateFormatMode("iso"), "iso");
assert.equal(sanitizeCurrencyFormatMode("plain"), "plain");
assert.equal(sanitizeCurrencyCodeOverride("usd"), "USD");
assert.equal(sanitizeCurrencyCodeOverride("XXX"), null);
assert.equal(sanitizeTimezoneOverride(""), null);
assert.equal(sanitizeTimezoneOverride("UTC"), "UTC");
assert.equal(sanitizeTimezoneOverride("Europe/Paris"), "Europe/Paris");
assert.equal(sanitizeTimezoneOverride("Fake/NotAZone"), null);
assert.equal(effectiveTimezone("jp", null), "Asia/Tokyo");
assert.equal(effectiveTimezone("de", null), "Europe/Berlin");
assert.equal(effectiveTimezone("jp", "UTC"), "UTC");
assert.equal(effectiveCurrencyCode("jp", null), "JPY");
assert.equal(effectiveCurrencyCode("uk", null), "GBP");
assert.equal(effectiveCurrencyCode("jp", "USD"), "USD");

const moneyRecord = formatAppMoney(
  100,
  {
    residence_region: "jp",
    currency_code_override: null,
    currency_format_mode: "residence",
    record_currency_code: "USD",
  },
  "ja",
);
assert.match(moneyRecord, /100|\$/);
assert.ok(listIanaTimezones().includes("Asia/Tokyo"));
assert.ok(listIanaTimezones().length > 50);

const moneyJp = formatAppMoney(
  12345,
  {
    residence_region: "jp",
    currency_code_override: null,
    currency_format_mode: "residence",
  },
  "ja",
);
assert.match(moneyJp, /12/);
assert.match(moneyJp, /345/);

const moneyPlain = formatAppMoney(
  12345,
  {
    residence_region: "jp",
    currency_code_override: null,
    currency_format_mode: "plain",
  },
  "ja",
);
assert.match(moneyPlain, /12/);
assert.ok(!moneyPlain.includes("USD"));


const instant = "2026-09-03T07:30:00.000Z";
const jpPrefs = {
  residence_region: "jp" as const,
  timezone_override: null,
  date_format_mode: "residence" as const,
};
const jp = formatAppDateTime(instant, jpPrefs, "en");
assert.match(jp, /2026/);
assert.match(jp, /9|09|Sept|Sep/);

const iso = formatAppDateTime(
  instant,
  { ...jpPrefs, date_format_mode: "iso" },
  "en",
);
assert.equal(iso, "2026-09-03 16:30");

const dateOnly = formatAppDateTime("2026-09-03", jpPrefs, "ja");
assert.ok(dateOnly.length > 0);
assert.ok(!dateOnly.includes(":"));

console.log("residencePrefs.selftest: OK");
