import { getLocale, getTranslations } from "next-intl/server";
import { OshiDayEditor } from "@/components/dashboard/OshiDayEditor";
import { SpendingBudgetEditor } from "@/components/dashboard/SpendingBudgetEditor";
import { Link } from "@/i18n/navigation";
import { FormattedAppMoney } from "@/components/format/FormattedAppMoney";
import { galleryListHref } from "@/lib/galleryListQuery";
import { formatSharePercent } from "@/lib/colorTagShare";

type CategoryRow = {
  category_tag_id: number;
  name: string;
  count: number;
  share: number;
};

type StorageRow = {
  storage_location_id: number;
  name: string;
  count: number;
  share: number;
  capacity_count: number | null;
  remaining: number | null;
};

type SpendRow = {
  currency_code: string | null;
  total: number;
  priced_count: number;
};

type MonthRow = {
  month: string;
  item_count: number;
  spend_by_currency: SpendRow[];
};

export type CollectionSummaryData = {
  product_count: number;
  want_object_count: number;
  sales_desired_count: number;
  categories: CategoryRow[];
  uncategorized_count: number;
  storage_locations: StorageRow[];
  unstored_count: number;
  spend_by_currency: SpendRow[];
  unpriced_count: number;
  spend_months: MonthRow[];
  undated_item_count: number;
  undated_spend: SpendRow[];
  current_month: string | null;
  missing_photo_count: number;
  duplicate_barcode_count: number;
};

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === "object";
}

function num(raw: unknown): number {
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}

function readSpendRows(raw: unknown): SpendRow[] {
  if (!Array.isArray(raw)) return [];
  const spend: SpendRow[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const code = item.currency_code;
    spend.push({
      currency_code: typeof code === "string" && code.trim() ? code : null,
      total: num(item.total),
      priced_count: num(item.priced_count),
    });
  }
  return spend;
}

/** API の collection を画面用に読む。欠けていても落ちない。 */
export function readCollectionSummary(raw: unknown): CollectionSummaryData {
  const row = isRecord(raw) ? raw : {};
  const categories: CategoryRow[] = [];
  if (Array.isArray(row.categories)) {
    for (const item of row.categories) {
      if (!isRecord(item) || typeof item.category_tag_id !== "number") continue;
      categories.push({
        category_tag_id: item.category_tag_id,
        name: typeof item.name === "string" ? item.name : "",
        count: num(item.count),
        share: num(item.share),
      });
    }
  }
  const storage: StorageRow[] = [];
  if (Array.isArray(row.storage_locations)) {
    for (const item of row.storage_locations) {
      if (!isRecord(item) || typeof item.storage_location_id !== "number") {
        continue;
      }
      const cap = item.capacity_count;
      const remaining = item.remaining;
      storage.push({
        storage_location_id: item.storage_location_id,
        name: typeof item.name === "string" ? item.name : "",
        count: num(item.count),
        share: num(item.share),
        capacity_count: typeof cap === "number" ? cap : null,
        remaining: typeof remaining === "number" ? remaining : null,
      });
    }
  }
  const spend = readSpendRows(row.spend_by_currency);
  const months: MonthRow[] = [];
  if (Array.isArray(row.spend_months)) {
    for (const item of row.spend_months) {
      if (!isRecord(item) || typeof item.month !== "string") continue;
      months.push({
        month: item.month,
        item_count: num(item.item_count),
        spend_by_currency: readSpendRows(item.spend_by_currency),
      });
    }
  }
  const current =
    typeof row.current_month === "string" && row.current_month
      ? row.current_month
      : null;
  return {
    product_count: num(row.product_count),
    want_object_count: num(row.want_object_count),
    sales_desired_count: num(row.sales_desired_count),
    categories,
    uncategorized_count: num(row.uncategorized_count),
    storage_locations: storage,
    unstored_count: num(row.unstored_count),
    spend_by_currency: spend,
    unpriced_count: num(row.unpriced_count),
    spend_months: months,
    undated_item_count: num(row.undated_item_count),
    undated_spend: readSpendRows(row.undated_spend),
    current_month: current,
    missing_photo_count: num(row.missing_photo_count),
    duplicate_barcode_count: num(row.duplicate_barcode_count),
  };
}

function CountLink({
  href,
  value,
  label,
}: {
  href: string;
  value: number;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 flex-col justify-center rounded-xl border border-border bg-card px-3 py-3 text-card-foreground transition hover:bg-muted/40"
    >
      <span className="text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Link>
  );
}

function ShareRows({
  rows,
}: {
  rows: {
    key: string;
    href: string;
    name: string;
    count: number;
    share: number;
    extra?: string;
  }[];
}) {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.key}>
          <Link href={row.href} className="block min-h-11 rounded-md px-1 py-1">
            <span className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate">{row.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.count} · {formatSharePercent(row.share)}
              </span>
            </span>
            {row.extra ? (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {row.extra}
              </span>
            ) : null}
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${Math.max(0, Math.min(100, row.share * 100))}%` }}
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * 所持数・収納とカテゴリ・通貨別の支出。色の円とは別。
 */
function formatMonth(month: string, locale: string): string {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const mon = Number(monthText);
  if (!year || !mon) return month;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(new Date(year, mon - 1, 1));
}

export async function CollectionSummary({
  raw,
  budgets,
  oshiDays,
}: {
  raw: unknown;
  budgets: unknown;
  oshiDays: unknown;
}) {
  const t = await getTranslations("Dashboard");
  const locale = await getLocale();
  const data = readCollectionSummary(raw);

  if (data.product_count <= 0) {
    return (
      <div className="flex flex-col gap-4">
        <OshiDayEditor raw={oshiDays} />
        <SpendingBudgetEditor raw={budgets} currentMonth={data.current_month} />
        <section className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t("emptyProducts")}</p>
          <Link
            href="/register"
            className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("registerLink")}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <OshiDayEditor raw={oshiDays} />
      <section aria-label={t("countsTitle")}>
        <h2 className="mb-2 text-lg font-medium tracking-tight">
          {t("countsTitle")}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <CountLink
            href="/gallery"
            value={data.product_count}
            label={t("countProducts")}
          />
          <CountLink
            href={galleryListHref({ want_object: true })}
            value={data.want_object_count}
            label={t("countWant")}
          />
          <CountLink
            href={galleryListHref({ sales_desired: true })}
            value={data.sales_desired_count}
            label={t("countSales")}
          />
          <CountLink
            href={galleryListHref({ missing_photo: true })}
            value={data.missing_photo_count}
            label={t("countMissingPhoto")}
          />
          <CountLink
            href={galleryListHref({ duplicate_barcode: true })}
            value={data.duplicate_barcode_count}
            label={t("countDuplicate")}
          />
        </div>
      </section>

      <SpendingBudgetEditor raw={budgets} currentMonth={data.current_month} />

      <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
        <h2 className="text-lg font-medium tracking-tight">{t("monthTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("monthHint")}</p>
        {data.spend_months.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("monthEmpty")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {data.spend_months.map((month) => (
              <li key={month.month}>
                <p className="text-sm font-medium">
                  <Link
                    href={galleryListHref({ purchase_month: month.month })}
                    className="underline-offset-4 hover:underline"
                  >
                    {formatMonth(month.month, locale)}
                  </Link>
                  <span className="ml-2 font-normal text-muted-foreground">
                    {t("pricedCount", { count: month.item_count })}
                  </span>
                </p>
                {month.spend_by_currency.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("spendEmpty")}</p>
                ) : (
                  <ul className="mt-1">
                    {month.spend_by_currency.map((row) => (
                      <li
                        key={`${month.month}-${row.currency_code ?? "unset"}`}
                        className="text-sm tabular-nums"
                      >
                        {row.currency_code ? (
                          <FormattedAppMoney
                            value={row.total}
                            currencyCode={row.currency_code}
                          />
                        ) : (
                          <>
                            {row.total}（{t("currencyUnset")}）
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        {data.undated_item_count > 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            <Link
              href={galleryListHref({ missing_purchase_date: true })}
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            >
              {t("undatedSpend", { count: data.undated_item_count })}
            </Link>
            {data.undated_spend.map((row) => (
              <span key={row.currency_code ?? "unset"} className="ml-2 text-foreground">
                {row.currency_code ? (
                  <FormattedAppMoney
                    value={row.total}
                    currencyCode={row.currency_code}
                  />
                ) : (
                  row.total
                )}
              </span>
            ))}
          </p>
        ) : null}
      </section>

      <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
        <h2 className="text-lg font-medium tracking-tight">{t("categoryTitle")}</h2>
        {data.categories.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("breakdownEmpty")}</p>
        ) : (
          <ShareRows
            rows={data.categories.map((row) => ({
              key: String(row.category_tag_id),
              href: galleryListHref({ category_tag_ids: [row.category_tag_id] }),
              name: row.name || t("unnamed"),
              count: row.count,
              share: row.share,
            }))}
          />
        )}
        {data.uncategorized_count > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link
              href={galleryListHref({ missing_category: true })}
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            >
              {t("uncategorized", { count: data.uncategorized_count })}
            </Link>
          </p>
        ) : null}
      </section>

      <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
        <h2 className="text-lg font-medium tracking-tight">{t("storageTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <Link
            href="/settings/storage-locations"
            className="underline-offset-4 hover:underline"
          >
            {t("storageCapacityLink")}
          </Link>
        </p>
        {data.storage_locations.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("breakdownEmpty")}</p>
        ) : (
          <ShareRows
            rows={data.storage_locations.map((row) => ({
              key: String(row.storage_location_id),
              href: galleryListHref({
                storage_location_ids: [row.storage_location_id],
              }),
              name: row.name || t("unnamed"),
              count: row.count,
              share: row.share,
              extra:
                row.capacity_count == null
                  ? undefined
                  : `${t("storageCapacity", { capacity: row.capacity_count })} · ${
                      row.remaining != null && row.remaining < 0
                        ? t("storageOver", { count: Math.abs(row.remaining) })
                        : t("storageLeft", { count: row.remaining ?? 0 })
                    }`,
            }))}
          />
        )}
        {data.unstored_count > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link
              href={galleryListHref({ missing_storage: true })}
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            >
              {t("unstored", { count: data.unstored_count })}
            </Link>
          </p>
        ) : null}
      </section>

      <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
        <h2 className="text-lg font-medium tracking-tight">{t("spendTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("spendHint")}</p>
        {data.spend_by_currency.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("spendEmpty")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {data.spend_by_currency.map((row) => (
              <li
                key={row.currency_code ?? "unset"}
                className="flex min-h-11 items-baseline justify-between gap-3 text-sm"
              >
                <span className="font-medium tabular-nums">
                  {row.currency_code ? (
                    <FormattedAppMoney
                      value={row.total}
                      currencyCode={row.currency_code}
                    />
                  ) : (
                    <>
                      {row.total}（{t("currencyUnset")}）
                    </>
                  )}
                </span>
                <span className="text-muted-foreground">
                  {t("pricedCount", { count: row.priced_count })}
                </span>
              </li>
            ))}
          </ul>
        )}
        {data.unpriced_count > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link
              href={galleryListHref({ missing_price: true })}
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            >
              {t("unpriced", { count: data.unpriced_count })}
            </Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}
