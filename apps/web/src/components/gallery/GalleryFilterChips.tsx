"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ListSortId } from "@/lib/displayPrefs";
import { LIST_SORT_IDS } from "@/lib/displayPrefs";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import {
  galleryFilterSummaryCounts,
  galleryListHref,
  hasActiveGalleryFilters,
  withClearedCategory,
  withClearedColor,
  withClearedProductColor,
  withClearedFilters,
  withClearedStorage,
  withSort,
  withToggledCategory,
  withToggledColorSlot,
  withToggledProductColor,
  withClearedPurchaseMonth,
  withToggledDuplicateBarcode,
  withToggledMissingCategory,
  withToggledMissingPhoto,
  withToggledMissingPrice,
  withToggledMissingStorage,
  withToggledMissingPurchaseDate,
  withToggledSalesDesired,
  withToggledStorage,
  withToggledWantObject,
} from "@/lib/galleryListQuery";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { PRODUCT_COLOR_CODES, PRODUCT_COLOR_HEX } from "@/lib/productColor";
import { cn } from "@/lib/utils";

export type GalleryFilterOption = {
  id: number;
  name: string;
};

export type GalleryColorOption = {
  slot: number;
  name: string;
  color: string;
};

type Props = {
  listQuery: GalleryListQuery;
  categories: GalleryFilterOption[];
  storageLocations: GalleryFilterOption[];
  colorTags?: GalleryColorOption[];
  /** URL に無いときの並び表示（設定既定） */
  effectiveSort: ListSortId;
};

function chipClass(active: boolean): string {
  return cn(
    "inline-flex min-h-9 items-center rounded-full px-3 py-1.5 text-xs font-medium transition",
    active
      ? "bg-primary text-primary-foreground"
      : "border border-border bg-card text-muted-foreground hover:bg-muted/60",
  );
}

/**
 * カテゴリ／収納／色の複数トグル＋並び。同種 OR・異種 AND。
 * 上部にいまの条件要約＋一発クリア。
 */
export function GalleryFilterChips({
  listQuery,
  categories,
  storageLocations,
  colorTags = [],
  effectiveSort,
}: Props) {
  const t = useTranslations("Gallery");
  const tCommon = useTranslations("Common");
  const tDisplay = useTranslations("DisplaySettings");
  const tColor = useTranslations("ProductColor");
  const [colorQuery, setColorQuery] = useState("");
  const [goodsColorOpen, setGoodsColorOpen] = useState(
    () => (listQuery.product_color_codes?.length ?? 0) > 0,
  );
  const { setListSort } = useDisplaySettings();

  const baseQuery: GalleryListQuery = {
    ...listQuery,
    sort: effectiveSort,
  };
  const selectedCats = new Set(listQuery.category_tag_ids ?? []);
  const selectedStorage = new Set(listQuery.storage_location_ids ?? []);
  const selectedColors = new Set(listQuery.color_tag_slots ?? []);
  const selectedGoodsColors = new Set(listQuery.product_color_codes ?? []);
  const colorNeedle = colorQuery.trim().toLowerCase();
  const visibleGoodsColors = PRODUCT_COLOR_CODES.filter((code) => {
    if (selectedGoodsColors.has(code)) return true;
    if (!colorNeedle) return true;
    return tColor(code).toLowerCase().includes(colorNeedle);
  });
  const showSummary = hasActiveGalleryFilters(listQuery);
  const counts = galleryFilterSummaryCounts(listQuery);
  const summaryParts: string[] = [];
  if (counts.q) summaryParts.push(t("filterSummaryQuery"));
  if (counts.category > 0) {
    summaryParts.push(
      t("filterSummaryCategory", { count: counts.category }),
    );
  }
  if (counts.storage > 0) {
    summaryParts.push(
      t("filterSummaryStorage", { count: counts.storage }),
    );
  }
  if (counts.color > 0) {
    summaryParts.push(t("filterSummaryColor", { count: counts.color }));
  }
  if (counts.product_color > 0) {
    summaryParts.push(
      t("filterSummaryProductColor", { count: counts.product_color }),
    );
  }
  if (counts.sales_desired) summaryParts.push(t("filterSummarySalesDesired"));
  if (counts.want_object) summaryParts.push(t("filterSummaryWant"));
  if (counts.missing_price) summaryParts.push(t("filterSummaryMissingPrice"));
  if (counts.missing_purchase_date) summaryParts.push(t("filterSummaryMissingDate"));
  if (counts.missing_category) summaryParts.push(t("filterSummaryMissingCategory"));
  if (counts.missing_storage) summaryParts.push(t("filterSummaryMissingStorage"));
  if (counts.missing_photo) summaryParts.push(t("filterSummaryMissingPhoto"));
  if (counts.duplicate_barcode) summaryParts.push(t("filterSummaryDuplicate"));
  if (counts.purchase_month && listQuery.purchase_month) {
    summaryParts.push(
      t("filterSummaryPurchaseMonth", { month: listQuery.purchase_month }),
    );
  }
  const summaryText = summaryParts.join(t("filterSummarySep"));

  return (
    <div className="flex flex-col gap-3">
      {showSummary ? (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-foreground">
            <span className="text-muted-foreground">
              {t("filterSummaryLabel")}
            </span>
            {summaryText}
          </p>
          <Link
            href={galleryListHref(withClearedFilters(baseQuery))}
            className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground transition hover:bg-muted/60"
          >
            {t("clearFilters")}
          </Link>
        </div>
      ) : null}

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          {t("statusFilter")}
        </p>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={t("statusFilter")}
        >
          <Link
            href={galleryListHref(withToggledSalesDesired(baseQuery))}
            className={chipClass(Boolean(listQuery.sales_desired))}
            aria-pressed={Boolean(listQuery.sales_desired)}
          >
            {t("salesDesiredFilter")}
          </Link>
          <Link
            href={galleryListHref(withToggledWantObject(baseQuery))}
            className={chipClass(Boolean(listQuery.want_object))}
            aria-pressed={Boolean(listQuery.want_object)}
          >
            {t("wantObjectFilter")}
          </Link>
          <Link
            href={galleryListHref(withToggledMissingPrice(baseQuery))}
            className={chipClass(Boolean(listQuery.missing_price))}
            aria-pressed={Boolean(listQuery.missing_price)}
          >
            {t("missingPriceFilter")}
          </Link>
          <Link
            href={galleryListHref(withToggledMissingPurchaseDate(baseQuery))}
            className={chipClass(Boolean(listQuery.missing_purchase_date))}
            aria-pressed={Boolean(listQuery.missing_purchase_date)}
          >
            {t("missingDateFilter")}
          </Link>
          <Link
            href={galleryListHref(withToggledMissingCategory(baseQuery))}
            className={chipClass(Boolean(listQuery.missing_category))}
            aria-pressed={Boolean(listQuery.missing_category)}
          >
            {t("missingCategoryFilter")}
          </Link>
          <Link
            href={galleryListHref(withToggledMissingStorage(baseQuery))}
            className={chipClass(Boolean(listQuery.missing_storage))}
            aria-pressed={Boolean(listQuery.missing_storage)}
          >
            {t("missingStorageFilter")}
          </Link>
          <Link
            href={galleryListHref(withToggledMissingPhoto(baseQuery))}
            className={chipClass(Boolean(listQuery.missing_photo))}
            aria-pressed={Boolean(listQuery.missing_photo)}
          >
            {t("missingPhotoFilter")}
          </Link>
          <Link
            href={galleryListHref(withToggledDuplicateBarcode(baseQuery))}
            className={chipClass(Boolean(listQuery.duplicate_barcode))}
            aria-pressed={Boolean(listQuery.duplicate_barcode)}
          >
            {t("duplicateBarcodeFilter")}
          </Link>
          {listQuery.purchase_month ? (
            <Link
              href={galleryListHref(withClearedPurchaseMonth(baseQuery))}
              className={chipClass(true)}
              aria-pressed
            >
              {t("purchaseMonthFilter", { month: listQuery.purchase_month })}
            </Link>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          {t("category")}
        </p>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={t("category")}
        >
          <Link
            href={galleryListHref(withClearedCategory(baseQuery))}
            className={chipClass(selectedCats.size === 0)}
            aria-pressed={selectedCats.size === 0}
          >
            {tCommon("all")}
          </Link>
          {categories.map((c) => {
            const active = selectedCats.has(c.id);
            return (
              <Link
                key={c.id}
                href={galleryListHref(withToggledCategory(baseQuery, c.id))}
                className={chipClass(active)}
                aria-pressed={active}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          {t("storage")}
        </p>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={t("storage")}
        >
          <Link
            href={galleryListHref(withClearedStorage(baseQuery))}
            className={chipClass(selectedStorage.size === 0)}
            aria-pressed={selectedStorage.size === 0}
          >
            {tCommon("all")}
          </Link>
          {storageLocations.map((s) => {
            const active = selectedStorage.has(s.id);
            return (
              <Link
                key={s.id}
                href={galleryListHref(withToggledStorage(baseQuery, s.id))}
                className={chipClass(active)}
                aria-pressed={active}
              >
                {s.name}
              </Link>
            );
          })}
        </div>
      </div>

      {colorTags.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            {t("color")}
          </p>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={t("color")}
          >
            <Link
              href={galleryListHref(withClearedColor(baseQuery))}
              className={chipClass(selectedColors.size === 0)}
              aria-pressed={selectedColors.size === 0}
            >
              {tCommon("all")}
            </Link>
            {colorTags.map((c) => {
              const active = selectedColors.has(c.slot);
              return (
                <Link
                  key={c.slot}
                  href={galleryListHref(
                    withToggledColorSlot(baseQuery, c.slot),
                  )}
                  className={chipClass(active)}
                  aria-pressed={active}
                >
                  <span
                    className="mr-1.5 inline-block size-2.5 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  {c.name}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <details
        className="rounded-xl border border-border bg-card p-3"
        open={goodsColorOpen}
        onToggle={(event) =>
          setGoodsColorOpen((event.currentTarget as HTMLDetailsElement).open)
        }
      >
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            {t("productColor")}
            {selectedGoodsColors.size > 0 ? (
              <span className="inline-flex gap-1" aria-hidden>
                {[...selectedGoodsColors].map((code) => (
                  <span
                    key={code}
                    className="inline-block size-2.5 rounded-full border border-border"
                    style={{
                      backgroundColor:
                        PRODUCT_COLOR_HEX[code as keyof typeof PRODUCT_COLOR_HEX],
                    }}
                  />
                ))}
              </span>
            ) : null}
          </span>
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="search"
            value={colorQuery}
            onChange={(event) => setColorQuery(event.target.value)}
            placeholder={tColor("searchPlaceholder")}
            aria-label={tColor("searchPlaceholder")}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("productColor")}>
            <Link
              href={galleryListHref(withClearedProductColor(baseQuery))}
              className={chipClass(selectedGoodsColors.size === 0)}
              aria-pressed={selectedGoodsColors.size === 0}
            >
              {tCommon("all")}
            </Link>
            {visibleGoodsColors.map((code) => {
              const active = selectedGoodsColors.has(code);
              return (
                <Link
                  key={code}
                  href={galleryListHref(withToggledProductColor(baseQuery, code))}
                  className={chipClass(active)}
                  aria-pressed={active}
                >
                  <span
                    className="mr-1.5 inline-block size-2.5 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: PRODUCT_COLOR_HEX[code] }}
                    aria-hidden
                  />
                  {tColor(code)}
                </Link>
              );
            })}
          </div>
        </div>
      </details>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          {t("sort")}
        </p>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={t("sort")}
        >
          {LIST_SORT_IDS.map((id) => {
            const active = effectiveSort === id;
            return (
              <Link
                key={id}
                href={galleryListHref(withSort(baseQuery, id))}
                className={chipClass(active)}
                aria-pressed={active}
                onClick={() => setListSort(id)}
              >
                {tDisplay(`listSortOptions.${id}` as "listSortOptions.newest")}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
