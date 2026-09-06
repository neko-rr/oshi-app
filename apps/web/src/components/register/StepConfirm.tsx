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
  CategoryTagItem,
  ColorTagItem,
  StorageLocationItem,
} from "./types";

type Props = {
  productName: string;
  productGroupName: string;
  characterName: string;
  purchasePrice: string;
  currencyCode: string;
  barcode: string;
  memo: string;
  photoFile: File | null;
  colors: ColorTagItem[];
  categories: CategoryTagItem[];
  storageLocations: StorageLocationItem[];
  categoryTagId: number | null;
  storageLocationId: number | null;
  selectedSlots: Set<number>;
  visualTags: string[];
  unmatchedProductType: string | null;
  assistHint: string | null;
  assistPhase: "idle" | "running" | "done";
  error: string | null;
  errorOffline?: boolean;
  loading: boolean;
  onProductName: (v: string) => void;
  onProductGroupName: (v: string) => void;
  onCharacterName: (v: string) => void;
  onPurchasePrice: (v: string) => void;
  onCurrencyCode: (v: string) => void;
  onBarcode: (v: string) => void;
  onMemo: (v: string) => void;
  onCategoryTagId: (id: number | null) => void;
  onStorageLocationId: (id: number | null) => void;
  onToggleSlot: (slot: number) => void;
  onApplyVisualTag: (tag: string) => void;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
  onContinueRegister: () => void;
  onRetrySubmit?: () => void;
  showContinue: boolean;
};

export function StepConfirm({
  productName,
  productGroupName,
  characterName,
  purchasePrice,
  currencyCode,
  barcode,
  memo,
  photoFile,
  colors,
  categories,
  storageLocations,
  categoryTagId,
  storageLocationId,
  selectedSlots,
  visualTags,
  unmatchedProductType,
  assistHint,
  assistPhase,
  error,
  errorOffline = false,
  loading,
  onProductName,
  onProductGroupName,
  onCharacterName,
  onPurchasePrice,
  onCurrencyCode,
  onBarcode,
  onMemo,
  onCategoryTagId,
  onStorageLocationId,
  onToggleSlot,
  onApplyVisualTag,
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
      <div className="grid gap-2">
        <Label htmlFor="product_name">{t("productName")}</Label>
        <Input
          id="product_name"
          required
          value={productName}
          onChange={(e) => onProductName(e.target.value)}
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
        <Label htmlFor="barcode">{t("barcode")}</Label>
        <Input
          id="barcode"
          value={barcode}
          onChange={(e) => onBarcode(e.target.value)}
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
          <legend className="text-sm font-medium">{t("visualTagsLegend")}</legend>
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

      {colors.length > 0 ? (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">{t("colorTagsLegend")}</legend>
          <div className="flex flex-col gap-2">
            {colors.map((c) => (
              <label key={c.slot} className="flex items-center gap-2 text-sm">
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

      {error ? (
        <NetworkRetryNotice
          message={error}
          offline={errorOffline}
          onRetry={onRetrySubmit}
        />
      ) : null}
        </>
      ) : null}

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
