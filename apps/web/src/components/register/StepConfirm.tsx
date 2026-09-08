"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FormEvent, useEffect, useState } from "react";
import { TagChipPicker } from "@/components/tags/TagChipPicker";
import { CurrencyCodePicker } from "@/components/settings/CurrencyCodePicker";
import { NetworkRetryNotice } from "@/components/feedback/NetworkRetryNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  BarcodeLookupItem,
  CategoryTagItem,
  ColorTagItem,
  StorageLocationItem,
} from "./types";

type Props = {
  productName: string;
  productGroupName: string;
  worksSeriesName: string;
  title: string;
  characterName: string;
  purchasePrice: string;
  currencyCode: string;
  purchaseLocation: string;
  purchaseDate: string;
  barcode: string;
  memo: string;
  registrationQuantity: string;
  salesDesired: boolean;
  salesDesiredQuantity: string;
  wantObject: boolean;
  photoFile: File | null;
  colors: ColorTagItem[];
  categories: CategoryTagItem[];
  storageLocations: StorageLocationItem[];
  categoryTagId: number | null;
  storageLocationId: number | null;
  selectedSlots: Set<number>;
  visualTags: string[];
  unmatchedProductType: string | null;
  lookupCandidates: BarcodeLookupItem[];
  selectedCandidateIndex: number | null;
  rakutenProductUrl: string;
  rakutenItemCode: string;
  rakutenShopName: string;
  manualProductUrl: string;
  manualUrlLabel: string;
  keywordQuery: string;
  keywordLookingUp: boolean;
  assistHint: string | null;
  assistPhase: "idle" | "running" | "done";
  error: string | null;
  errorOffline?: boolean;
  loading: boolean;
  onProductName: (v: string) => void;
  onProductGroupName: (v: string) => void;
  onWorksSeriesName: (v: string) => void;
  onTitle: (v: string) => void;
  onCharacterName: (v: string) => void;
  onPurchasePrice: (v: string) => void;
  onCurrencyCode: (v: string) => void;
  onPurchaseLocation: (v: string) => void;
  onPurchaseDate: (v: string) => void;
  onBarcode: (v: string) => void;
  onMemo: (v: string) => void;
  onRegistrationQuantity: (v: string) => void;
  onSalesDesired: (v: boolean) => void;
  onSalesDesiredQuantity: (v: string) => void;
  onWantObject: (v: boolean) => void;
  onSelectCandidate: (index: number) => void;
  onManualProductUrl: (v: string) => void;
  onManualUrlLabel: (v: string) => void;
  onKeywordQuery: (v: string) => void;
  onKeywordSearch: () => void;
  onCategoryTagId: (id: number | null) => void;
  onStorageLocationId: (id: number | null) => void;
  onToggleSlot: (slot: number) => void;
  onApplyVisualTag: (tag: string) => void;
  onClearEventBundle: () => void;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
  onContinueRegister: () => void;
  onRetrySubmit?: () => void;
  showContinue: boolean;
};

export function StepConfirm({
  productName,
  productGroupName,
  worksSeriesName,
  title,
  characterName,
  purchasePrice,
  currencyCode,
  purchaseLocation,
  purchaseDate,
  barcode,
  memo,
  registrationQuantity,
  salesDesired,
  salesDesiredQuantity,
  wantObject,
  photoFile,
  colors,
  categories,
  storageLocations,
  categoryTagId,
  storageLocationId,
  selectedSlots,
  visualTags,
  unmatchedProductType,
  lookupCandidates,
  selectedCandidateIndex,
  rakutenProductUrl,
  rakutenItemCode,
  rakutenShopName,
  manualProductUrl,
  manualUrlLabel,
  keywordQuery,
  keywordLookingUp,
  assistHint,
  assistPhase,
  error,
  errorOffline = false,
  loading,
  onProductName,
  onProductGroupName,
  onWorksSeriesName,
  onTitle,
  onCharacterName,
  onPurchasePrice,
  onCurrencyCode,
  onPurchaseLocation,
  onPurchaseDate,
  onBarcode,
  onMemo,
  onRegistrationQuantity,
  onSalesDesired,
  onSalesDesiredQuantity,
  onWantObject,
  onSelectCandidate,
  onManualProductUrl,
  onManualUrlLabel,
  onKeywordQuery,
  onKeywordSearch,
  onCategoryTagId,
  onStorageLocationId,
  onToggleSlot,
  onApplyVisualTag,
  onClearEventBundle,
  onBack,
  onSubmit,
  onContinueRegister,
  onRetrySubmit,
  showContinue,
}: Props) {
  const t = useTranslations("Register.confirm");
  const tPhoto = useTranslations("Register.photo");
  const tAssist = useTranslations("Register.assist");
  const tCommon = useTranslations("Common");
  const tNav = useTranslations("Nav");
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoFile) {
      setThumbUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
        {assistPhase === "running" && !showContinue ? (
          <p className="mt-2 text-xs text-muted-foreground" role="status">
            {tAssist("applyingSuggestionsHint")}
          </p>
        ) : null}
        {assistHint ? (
          <p
            className={
              showContinue
                ? "mt-2 rounded-md border border-border bg-accent/40 px-3 py-2 text-sm text-foreground"
                : "mt-2 text-xs text-muted-foreground"
            }
            role="status"
          >
            {assistHint}
          </p>
        ) : null}
      </div>

      {thumbUrl && !showContinue ? (
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL */}
          <img
            src={thumbUrl}
            alt={tPhoto("confirmThumbAlt")}
            className="mx-auto max-h-40 w-full object-contain"
          />
        </div>
      ) : null}

      {!showContinue ? (
        <>
          {lookupCandidates.length > 0 ? (
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">
                {t("candidatesLegend")}
              </legend>
              <p className="text-xs text-muted-foreground">
                {t("candidatesHint")}
              </p>
              <ul className="flex flex-col gap-2">
                {lookupCandidates.map((c, idx) => {
                  const selected = selectedCandidateIndex === idx;
                  return (
                    <li
                      key={`${c.external_item_code ?? c.product_url ?? idx}-${idx}`}
                    >
                      <Button
                        type="button"
                        variant={selected ? "default" : "outline"}
                        onClick={() => onSelectCandidate(idx)}
                        className="flex h-auto w-full gap-3 rounded-lg p-2 text-left"
                        aria-pressed={selected}
                      >
                        {c.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- 外部サムネ
                          <img
                            src={c.image_url}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-sm font-medium">
                            {c.name?.trim() || t("candidateUntitled")}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {[
                              c.price != null ? String(c.price) : null,
                              c.shop_name?.trim() || null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ) : null}

          <div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
            <p className="text-sm font-medium">{t("keywordSearchTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("keywordSearchHint")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Input
                id="keyword_search"
                value={keywordQuery}
                onChange={(e) => onKeywordQuery(e.target.value)}
                placeholder={t("keywordSearchPlaceholder")}
                className="min-w-[12rem] flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={keywordLookingUp || !keywordQuery.trim()}
                onClick={onKeywordSearch}
              >
                {keywordLookingUp
                  ? t("keywordSearching")
                  : t("keywordSearchRun")}
              </Button>
            </div>
          </div>

          {rakutenProductUrl || rakutenItemCode || rakutenShopName ? (
            <div className="grid gap-2 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{t("rakutenBlockTitle")}</p>
              <p className="text-xs text-muted-foreground">
                {t("rakutenBlockNote")}
              </p>
              {rakutenShopName ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    {t("rakutenShop")}:{" "}
                  </span>
                  {rakutenShopName}
                </p>
              ) : null}
              {rakutenItemCode ? (
                <p className="break-all text-xs text-muted-foreground">
                  {t("rakutenItemCode")}: {rakutenItemCode}
                </p>
              ) : null}
              {rakutenProductUrl ? (
                <a
                  href={rakutenProductUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline-offset-2 hover:underline"
                >
                  {t("rakutenOpenLink")}
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="product_name">{t("productName")}</Label>
            <Input
              id="product_name"
              required
              value={productName}
              onChange={(e) => onProductName(e.target.value)}
            />
          </div>

          {categories.length > 0 ? (
            <TagChipPicker
              label={t("category")}
              variant="category"
              value={categoryTagId}
              onChange={onCategoryTagId}
              options={categories.map((c) => ({
                id: c.category_tag_id,
                name: c.category_tag_name,
                icon: c.category_tag_icon,
                color: c.category_tag_color,
              }))}
            />
          ) : null}

          {unmatchedProductType ? (
            <p className="text-xs text-muted-foreground">
              {t("unmatchedType", { name: unmatchedProductType })}
            </p>
          ) : null}

          {storageLocations.length > 0 ? (
            <TagChipPicker
              label={t("storage")}
              variant="storage"
              value={storageLocationId}
              onChange={onStorageLocationId}
              options={storageLocations.map((s) => ({
                id: s.storage_location_id,
                name: s.storage_location_name,
                icon: s.storage_location_icon,
              }))}
            />
          ) : null}

          {colors.length > 0 ? (
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">
                {t("colorTagsLegend")}
              </legend>
              <div className="flex flex-col gap-2">
                {colors.map((c) => (
                  <label
                    key={c.slot}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSlots.has(c.slot)}
                      onChange={() => onToggleSlot(c.slot)}
                    />
                    <span
                      className="inline-block h-3 w-3 rounded border border-border"
                      style={{ backgroundColor: c.color_tag_color }}
                      aria-hidden
                    />
                    {t("colorSlot", { name: c.color_tag_name, slot: c.slot })}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <details className="rounded-2xl border border-border bg-card p-4 open:shadow-sm">
            <summary className="cursor-pointer text-base font-medium">
              {t("detailsSummary")}
            </summary>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("detailsHint")}
            </p>
            <div className="mt-4 flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="works_series_name">{t("worksSeriesName")}</Label>
                <Input
                  id="works_series_name"
                  value={worksSeriesName}
                  onChange={(e) => onWorksSeriesName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title_name">{t("titleName")}</Label>
                <Input
                  id="title_name"
                  value={title}
                  onChange={(e) => onTitle(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product_group_name">{t("productGroupName")}</Label>
                <Input
                  id="product_group_name"
                  value={productGroupName}
                  onChange={(e) => onProductGroupName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="character_name">{t("characterName")}</Label>
                <Input
                  id="character_name"
                  value={characterName}
                  onChange={(e) => onCharacterName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="registration_quantity">
                  {t("registrationQuantity")}
                </Label>
                <Input
                  id="registration_quantity"
                  type="number"
                  min={1}
                  max={999}
                  inputMode="numeric"
                  value={registrationQuantity}
                  onChange={(e) => onRegistrationQuantity(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={salesDesired}
                  onChange={(e) => onSalesDesired(e.target.checked)}
                />
                {t("salesDesired")}
              </label>
              {salesDesired ? (
                <div className="grid gap-2">
                  <Label htmlFor="sales_desired_quantity">
                    {t("salesDesiredQuantity")}
                  </Label>
                  <Input
                    id="sales_desired_quantity"
                    type="number"
                    min={0}
                    max={999}
                    inputMode="numeric"
                    value={salesDesiredQuantity}
                    onChange={(e) => onSalesDesiredQuantity(e.target.value)}
                  />
                </div>
              ) : null}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={wantObject}
                  onChange={(e) => onWantObject(e.target.checked)}
                />
                {t("wantObject")}
              </label>

              <div className="grid gap-2">
                <Label htmlFor="purchase_price">{t("purchasePrice")}</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  inputMode="numeric"
                  value={purchasePrice}
                  onChange={(e) => onPurchasePrice(e.target.value)}
                />
              </div>

              <CurrencyCodePicker
                id="currency_code"
                value={currencyCode}
                onChange={onCurrencyCode}
              />

              <div className="grid gap-2">
                <Label htmlFor="purchase_location">{t("purchaseLocation")}</Label>
                <Input
                  id="purchase_location"
                  value={purchaseLocation}
                  onChange={(e) => onPurchaseLocation(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="purchase_date">{t("purchaseDate")}</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => onPurchaseDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="barcode">{t("barcode")}</Label>
                <Input
                  id="barcode"
                  value={barcode}
                  onChange={(e) => onBarcode(e.target.value)}
                />
              </div>

              <div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
                <p className="text-sm font-medium">{t("manualUrlTitle")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("manualUrlHint")}
                </p>
                <Label htmlFor="manual_url_label">{t("manualUrlLabel")}</Label>
                <Input
                  id="manual_url_label"
                  value={manualUrlLabel}
                  onChange={(e) => onManualUrlLabel(e.target.value)}
                  placeholder={t("manualUrlLabelPlaceholder")}
                />
                <Label htmlFor="manual_product_url">{t("manualUrl")}</Label>
                <Input
                  id="manual_product_url"
                  type="url"
                  inputMode="url"
                  value={manualProductUrl}
                  onChange={(e) => onManualProductUrl(e.target.value)}
                  placeholder="https://"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="memo">{t("memo")}</Label>
                <Input
                  id="memo"
                  value={memo}
                  onChange={(e) => onMemo(e.target.value)}
                />
              </div>

              {visualTags.length > 0 ? (
                <fieldset className="grid gap-2">
                  <legend className="text-sm font-medium">
                    {t("visualTagsLegend")}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {visualTags.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto rounded-full px-3 py-1 text-xs font-normal"
                        onClick={() => onApplyVisualTag(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </fieldset>
              ) : null}
            </div>
          </details>

          <div className="grid gap-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClearEventBundle}
            >
              {t("clearEventBundle")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("clearEventBundleHint")}
            </p>
          </div>

          {error ? (
            <NetworkRetryNotice
              message={error}
              offline={errorOffline}
              onRetry={onRetrySubmit}
            />
          ) : null}
        </>
      ) : (
        <div className="grid gap-1">
          <Button type="button" variant="outline" onClick={onClearEventBundle}>
            {t("clearEventBundle")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("clearEventBundleHint")}
          </p>
        </div>
      )}

      <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-10 -mx-1 flex flex-wrap gap-3 border-t border-border bg-background/95 px-1 py-2 backdrop-blur lg:static lg:bottom-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        {showContinue ? (
          <>
            <Button type="button" onClick={onContinueRegister}>
              {t("continueRegister")}
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link href="/gallery">{t("gallery")}</Link>
            </Button>
          </>
        ) : (
          <>
            <Button type="submit" disabled={loading}>
              {loading ? tCommon("saving") : t("register")}
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              {tCommon("back")}
            </Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/gallery">{tNav("gallery")}</Link>
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
