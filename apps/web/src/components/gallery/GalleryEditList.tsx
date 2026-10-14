"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { API_PATHS, type ProductEditListItem } from "@oshi/shared";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { NetworkRetryNotice } from "@/components/feedback/NetworkRetryNotice";
import { CurrencyCodePicker } from "@/components/settings/CurrencyCodePicker";
import { ProductColorPicker } from "@/components/product/ProductColorPicker";
import { toggleProductColorCode } from "@/lib/productColor";
import { TagChipPicker } from "@/components/tags/TagChipPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { createClient } from "@/lib/client";
import {
  draftFromEditItem,
  isEditRowDirty,
  mapWithConcurrency,
  patchBodyFromEditDraft,
  type GalleryEditDraft,
} from "@/lib/galleryEditDraft";
import { RotateCcw, RotateCw } from "@/lib/icons";
import { findResidenceRegion } from "@/lib/residencePrefs";
import { isLikelyOfflineError, networkUserMessage } from "@/lib/networkError";
import { rotateRegisterPhoto } from "@/lib/prepareRegisterPhoto";

type TagOption = {
  id: number;
  name: string;
  icon?: string | null;
  color?: string | null;
};

type ColorOption = {
  slot: number;
  name: string;
  color: string;
};

type Props = {
  items: ProductEditListItem[];
  categoryOptions: TagOption[];
  storageOptions: TagOption[];
  colorOptions: ColorOption[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onExit: () => void;
  onItemsChange: (items: ProductEditListItem[]) => void;
};

/**
 * 読み込み済み製品を行ごとに直す。回転は保存まで端末内のプレビュー。
 */
export function GalleryEditList({
  items,
  categoryOptions,
  storageOptions,
  colorOptions,
  hasMore,
  loadingMore,
  onLoadMore,
  onExit,
  onItemsChange,
}: Props) {
  const t = useTranslations("Gallery");
  const tDetail = useTranslations("ProductDetail");
  const tCommon = useTranslations("Common");
  const { flashSuccess } = useFeedback();
  const { residenceRegion } = useDisplaySettings();
  const defaultCurrency = findResidenceRegion(residenceRegion).currencyCode;
  const [showDetail, setShowDetail] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, GalleryEditDraft>>(() =>
    seedDrafts(items, defaultCurrency),
  );
  const [baselines, setBaselines] = useState<Record<number, GalleryEditDraft>>(
    () => seedDrafts(items, defaultCurrency),
  );
  const [pendingPhotos, setPendingPhotos] = useState<Record<number, File>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [rowOffline, setRowOffline] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [rotatingId, setRotatingId] = useState<number | null>(null);
  const [barError, setBarError] = useState<string | null>(null);
  const [barOffline, setBarOffline] = useState(false);
  const previewsRef = useRef(previewUrls);
  previewsRef.current = previewUrls;

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of items) {
        const id = item.registered_product_id;
        if (next[id]) continue;
        next[id] = draftFromEditItem(item, defaultCurrency);
        changed = true;
      }
      return changed ? next : prev;
    });
    setBaselines((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of items) {
        const id = item.registered_product_id;
        if (next[id]) continue;
        next[id] = draftFromEditItem(item, defaultCurrency);
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [items, defaultCurrency]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(previewsRef.current)) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const dirtyIds = useMemo(() => {
    const ids: number[] = [];
    for (const item of items) {
      const id = item.registered_product_id;
      const baseline = baselines[id];
      const draft = drafts[id];
      if (!baseline || !draft) continue;
      if (isEditRowDirty(baseline, draft, Boolean(pendingPhotos[id]))) {
        ids.push(id);
      }
    }
    return ids;
  }, [items, baselines, drafts, pendingPhotos]);

  useEffect(() => {
    if (dirtyIds.length === 0) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyIds.length]);

  function updateDraft(id: number, patch: Partial<GalleryEditDraft>) {
    setDrafts((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, ...patch } };
    });
    setRowErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function requestExit() {
    if (dirtyIds.length > 0 && !window.confirm(t("editDiscardConfirm"))) return;
    onExit();
  }

  async function sessionToken(): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return data.session.access_token;
  }

  async function rotateRow(item: ProductEditListItem, degrees: 90 | -90) {
    const id = item.registered_product_id;
    const sourceUrl =
      item.photo_high_resolution_url || item.photo_thumbnail_url;
    if (!pendingPhotos[id] && !sourceUrl) return;
    setRotatingId(id);
    setBarError(null);
    try {
      let file = pendingPhotos[id];
      if (!file) {
        const res = await fetch(sourceUrl as string);
        if (!res.ok) {
          throw new Error(t("editRotateFailed"));
        }
        const blob = await res.blob();
        file = new File([blob], "photo.jpg", {
          type: blob.type || "image/jpeg",
        });
      }
      const rotated = await rotateRegisterPhoto(file, degrees, { plan: "free" });
      if (!rotated.ok) {
        throw new Error(t("editRotateFailed"));
      }
      const nextUrl = URL.createObjectURL(rotated.file);
      setPendingPhotos((prev) => ({ ...prev, [id]: rotated.file }));
      setPreviewUrls((prev) => {
        const previous = prev[id];
        if (previous) URL.revokeObjectURL(previous);
        return { ...prev, [id]: nextUrl };
      });
    } catch (err: unknown) {
      const offline = isLikelyOfflineError(err);
      setRowOffline((prev) => ({ ...prev, [id]: offline }));
      setRowErrors((prev) => ({
        ...prev,
        [id]: networkUserMessage(err, {
          offline: tCommon("offlineHint"),
          fallback: t("editRotateFailed"),
        }),
      }));
    } finally {
      setRotatingId(null);
    }
  }

  async function saveDirty() {
    if (dirtyIds.length === 0 || saving) return;
    setSaving(true);
    setBarError(null);
    setBarOffline(false);
    const token = await sessionToken();
    if (!token) {
      setBarError(tCommon("loginRequired"));
      setSaving(false);
      return;
    }
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
    if (!base) {
      setBarError(t("apiBaseMissing"));
      setSaving(false);
      return;
    }
    const targets = items.filter((item) =>
      dirtyIds.includes(item.registered_product_id),
    );
    const savedIds: number[] = [];
    const nextErrors: Record<number, string> = {};
    const nextOffline: Record<number, boolean> = {};
    const nextItems = new Map(
      items.map((item) => [item.registered_product_id, item]),
    );
    const nextBaselines: Record<number, GalleryEditDraft> = {};
    const clearedPhotos: number[] = [];

    await mapWithConcurrency(targets, 4, async (item) => {
      const id = item.registered_product_id;
      const draft = drafts[id];
      if (!draft) return;
      const patched = patchBodyFromEditDraft(draft, defaultCurrency);
      if (!patched.ok) {
        nextErrors[id] = tDetail("productNameRequired");
        return;
      }
      try {
        const body = { ...patched.body };
        const pending = pendingPhotos[id];
        if (pending) {
          const form = new FormData();
          form.append("file", pending);
          const photoRes = await fetch(`${base}${API_PATHS.photos}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          });
          if (!photoRes.ok) {
            const detail = (await photoRes.text()).slice(0, 160);
            throw new Error(tCommon("updateFailedPrefix", { detail }));
          }
          const photoJson = (await photoRes.json()) as { photo_id?: number };
          if (!photoJson.photo_id) {
            throw new Error(t("editRotateFailed"));
          }
          body.photo_id = photoJson.photo_id;
        }
        const res = await fetch(`${base}${API_PATHS.products}/${id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const detail = (await res.text()).slice(0, 160);
          throw new Error(tCommon("updateFailedPrefix", { detail }));
        }
        const updated = (await res.json()) as ProductEditListItem;
        nextItems.set(id, {
          ...item,
          ...updated,
          product_name: draft.product_name.trim(),
          photo_thumbnail_url:
            updated.photo_thumbnail_url ?? item.photo_thumbnail_url,
          photo_high_resolution_url:
            updated.photo_high_resolution_url ??
            item.photo_high_resolution_url,
        });
        nextBaselines[id] = draft;
        if (pending) clearedPhotos.push(id);
        savedIds.push(id);
      } catch (err: unknown) {
        nextOffline[id] = isLikelyOfflineError(err);
        nextErrors[id] = networkUserMessage(err, {
          offline: tCommon("offlineHint"),
          fallback: tCommon("updateFailed"),
        });
      }
    });

    if (Object.keys(nextBaselines).length > 0) {
      setBaselines((prev) => ({ ...prev, ...nextBaselines }));
    }
    if (clearedPhotos.length > 0) {
      setPendingPhotos((prev) => {
        const next = { ...prev };
        for (const id of clearedPhotos) delete next[id];
        return next;
      });
      setPreviewUrls((prev) => {
        const next = { ...prev };
        for (const id of clearedPhotos) {
          const url = next[id];
          if (url) URL.revokeObjectURL(url);
          delete next[id];
        }
        return next;
      });
    }
    setRowErrors(nextErrors);
    setRowOffline(nextOffline);
    onItemsChange([...nextItems.values()]);
    if (savedIds.length > 0 && Object.keys(nextErrors).length === 0) {
      flashSuccess(tCommon("savedFlash"));
    } else if (Object.keys(nextErrors).length > 0) {
      setBarError(t("editPartialFailed"));
      setBarOffline(Object.values(nextOffline).some(Boolean));
    }
    setSaving(false);
  }

  return (
    <div className="stack-density pb-[calc(8rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t("editFieldMode")}
      >
        <Button
          type="button"
          size="sm"
          className="min-h-11"
          variant={showDetail ? "outline" : "default"}
          aria-pressed={!showDetail}
          onClick={() => setShowDetail(false)}
        >
          {t("editBasic")}
        </Button>
        <Button
          type="button"
          size="sm"
          className="min-h-11"
          variant={showDetail ? "default" : "outline"}
          aria-pressed={showDetail}
          onClick={() => setShowDetail(true)}
        >
          {t("editDetail")}
        </Button>
      </div>

      <ul className="flex flex-col gap-3" aria-label={t("editListLabel")}>
        {items.map((item) => {
          const id = item.registered_product_id;
          const draft = drafts[id];
          if (!draft) return null;
          const dirty = dirtyIds.includes(id);
          const photoUrl = previewUrls[id] || item.photo_thumbnail_url;
          const canRotate = Boolean(
            item.photo_id ||
              item.photo_thumbnail_url ||
              item.photo_high_resolution_url,
          );
          return (
            <li
              key={id}
              className={[
                "rounded-xl border bg-card p-3",
                rowErrors[id]
                  ? "border-destructive"
                  : dirty
                    ? "border-primary"
                    : "border-border",
              ].join(" ")}
            >
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="flex w-full shrink-0 flex-col gap-2 lg:sticky lg:top-16 lg:w-44 lg:bg-card">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 署名URLまたは端末プレビュー
                    <img
                      src={photoUrl}
                      alt={t("editPhotoAlt")}
                      className="h-28 w-full rounded-lg border border-border object-contain bg-muted"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                      {t("noImage")}
                    </div>
                  )}
                  {canRotate ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-11 flex-1"
                        aria-label={t("editRotateLeft")}
                        disabled={saving || rotatingId === id}
                        onClick={() => void rotateRow(item, -90)}
                      >
                        <RotateCcw className="size-4" aria-hidden />
                        {t("editRotateLeft")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-11 flex-1"
                        aria-label={t("editRotateRight")}
                        disabled={saving || rotatingId === id}
                        onClick={() => void rotateRow(item, 90)}
                      >
                        <RotateCw className="size-4" aria-hidden />
                        {t("editRotateRight")}
                      </Button>
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    <Label htmlFor={`edit_name_${id}`}>
                      {tDetail("productNameLabel")}
                    </Label>
                    <Input
                      id={`edit_name_${id}`}
                      value={draft.product_name}
                      required
                      onChange={(event) =>
                        updateDraft(id, { product_name: event.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1 overflow-x-auto">
                  <div
                    className={
                      showDetail
                        ? "grid gap-3 lg:min-w-xl lg:grid-cols-2"
                        : "grid gap-3"
                    }
                  >
                    <TagChipPicker
                      label={tDetail("categoryTagLabel")}
                      variant="category"
                      value={draft.category_tag_id}
                      onChange={(value) =>
                        updateDraft(id, { category_tag_id: value })
                      }
                      options={categoryOptions}
                    />
                    <TagChipPicker
                      label={tDetail("storageLocationLabel")}
                      variant="storage"
                      value={draft.storage_location_id}
                      onChange={(value) =>
                        updateDraft(id, { storage_location_id: value })
                      }
                      options={storageOptions}
                    />
                    <div className="lg:col-span-2">
                      <ProductColorPicker
                        legend={tDetail("productColorsLegend")}
                        selected={draft.product_color_codes}
                        onToggle={(code) => {
                          updateDraft(id, {
                            product_color_codes: toggleProductColorCode(
                              draft.product_color_codes,
                              code,
                            ),
                          });
                        }}
                      />
                    </div>
                    <fieldset className="grid gap-2 lg:col-span-2">
                      <legend className="text-sm font-medium">
                        {tDetail("colorTagsLegend")}
                      </legend>
                      {colorOptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {tDetail("colorTagsEmpty")}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {colorOptions.map((color) => {
                            const checked = draft.color_tag_slots.includes(
                              color.slot,
                            );
                            return (
                              <label
                                key={color.slot}
                                className="flex min-h-11 items-center gap-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    const slots = checked
                                      ? draft.color_tag_slots.filter(
                                          (slot) => slot !== color.slot,
                                        )
                                      : [...draft.color_tag_slots, color.slot];
                                    updateDraft(id, {
                                      color_tag_slots: slots,
                                    });
                                  }}
                                />
                                <span
                                  className="inline-block h-3 w-3 rounded border border-border"
                                  style={{ backgroundColor: color.color }}
                                  aria-hidden
                                />
                                {tDetail("colorTagSlot", {
                                  name: color.name,
                                  slot: color.slot,
                                })}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </fieldset>

                    {showDetail ? (
                      <DetailFields
                        id={id}
                        draft={draft}
                        onChange={(patch) => updateDraft(id, patch)}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
              {rowErrors[id] ? (
                <div className="mt-3">
                  <NetworkRetryNotice
                    message={rowErrors[id]}
                    offline={rowOffline[id]}
                    onRetry={() => void saveDirty()}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full max-w-xs rounded-full"
            disabled={loadingMore || saving}
            onClick={onLoadMore}
          >
            {loadingMore ? tCommon("loading") : t("loadMore")}
          </Button>
        </div>
      ) : null}

      <div
        className="fixed inset-x-0 bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto flex max-w-3xl flex-col gap-2 border-t border-border bg-card/95 px-3 py-3 shadow-sm backdrop-blur lg:sticky lg:top-14 lg:bottom-auto lg:z-10 lg:rounded-xl lg:border"
        role="region"
        aria-label={t("editSaveRegion", { count: dirtyIds.length })}
      >
        {barError ? (
          <NetworkRetryNotice
            message={barError}
            offline={barOffline}
            onRetry={() => void saveDirty()}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11"
            disabled={saving || dirtyIds.length === 0}
            onClick={() => void saveDirty()}
          >
            {saving
              ? t("editSaving")
              : t("editSave", { count: dirtyIds.length })}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={saving}
            onClick={requestExit}
          >
            {t("editExit")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function seedDrafts(
  items: ProductEditListItem[],
  defaultCurrency: string,
): Record<number, GalleryEditDraft> {
  const next: Record<number, GalleryEditDraft> = {};
  for (const item of items) {
    next[item.registered_product_id] = draftFromEditItem(item, defaultCurrency);
  }
  return next;
}

function DetailFields({
  id,
  draft,
  onChange,
}: {
  id: number;
  draft: GalleryEditDraft;
  onChange: (patch: Partial<GalleryEditDraft>) => void;
}) {
  const t = useTranslations("ProductDetail");
  return (
    <>
      <TextField
        id={`edit_group_${id}`}
        label={t("groupNameLabel")}
        value={draft.product_group_name}
        onChange={(value) => onChange({ product_group_name: value })}
      />
      <TextField
        id={`edit_series_${id}`}
        label={t("worksSeriesNameLabel")}
        value={draft.works_series_name}
        onChange={(value) => onChange({ works_series_name: value })}
      />
      <TextField
        id={`edit_title_${id}`}
        label={t("titleNameLabel")}
        value={draft.title}
        onChange={(value) => onChange({ title: value })}
      />
      <TextField
        id={`edit_character_${id}`}
        label={t("characterNameLabel")}
        value={draft.character_name}
        onChange={(value) => onChange({ character_name: value })}
      />
      <TextField
        id={`edit_qty_${id}`}
        label={t("registrationQuantityLabel")}
        value={draft.registration_quantity}
        inputMode="numeric"
        onChange={(value) => onChange({ registration_quantity: value })}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.sales_desired}
          onChange={(event) =>
            onChange({
              sales_desired: event.target.checked,
              sales_desired_user_touched: true,
            })
          }
        />
        {t("salesDesiredLabel")}
      </label>
      {draft.sales_desired ? (
        <TextField
          id={`edit_sales_qty_${id}`}
          label={t("salesDesiredQuantityLabel")}
          value={draft.sales_desired_quantity}
          inputMode="numeric"
          onChange={(value) =>
            onChange({
              sales_desired_quantity: value,
              sales_desired_user_touched: true,
            })
          }
        />
      ) : null}
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.want_object}
          onChange={(event) =>
            onChange({ want_object: event.target.checked })
          }
        />
        {t("wantObjectLabel")}
      </label>
      <TextField
        id={`edit_price_${id}`}
        label={t("purchasePriceLabel")}
        value={draft.purchase_price}
        inputMode="numeric"
        onChange={(value) => onChange({ purchase_price: value })}
      />
      <CurrencyCodePicker
        id={`edit_currency_${id}`}
        value={draft.currency_code}
        onChange={(value) => onChange({ currency_code: value })}
      />
      <TextField
        id={`edit_place_${id}`}
        label={t("purchaseLocationLabel")}
        value={draft.purchase_location}
        onChange={(value) => onChange({ purchase_location: value })}
      />
      <div className="grid gap-2">
        <Label htmlFor={`edit_date_${id}`}>{t("purchaseDateLabel")}</Label>
        <Input
          id={`edit_date_${id}`}
          type="date"
          value={draft.purchase_date}
          onChange={(event) =>
            onChange({ purchase_date: event.target.value })
          }
        />
      </div>
      <TextField
        id={`edit_barcode_${id}`}
        label={t("barcodeLabel")}
        value={draft.barcode_number}
        onChange={(value) => onChange({ barcode_number: value })}
      />
      <TextField
        id={`edit_memo_${id}`}
        label={t("memoLabel")}
        value={draft.memo}
        onChange={(value) => onChange({ memo: value })}
      />
      <TextField
        id={`edit_rakuten_url_${id}`}
        label={t("rakutenUrlLabel")}
        value={draft.rakuten_url}
        onChange={(value) => onChange({ rakuten_url: value })}
      />
      <TextField
        id={`edit_rakuten_code_${id}`}
        label={t("rakutenCodeLabel")}
        value={draft.rakuten_code}
        onChange={(value) => onChange({ rakuten_code: value })}
      />
      <TextField
        id={`edit_rakuten_shop_${id}`}
        label={t("rakutenShopLabel")}
        value={draft.rakuten_shop}
        onChange={(value) => onChange({ rakuten_shop: value })}
      />
      <TextField
        id={`edit_manual_label_${id}`}
        label={t("manualLabelLabel")}
        value={draft.manual_label}
        onChange={(value) => onChange({ manual_label: value })}
      />
      <TextField
        id={`edit_manual_url_${id}`}
        label={t("manualUrlLabel")}
        value={draft.manual_url}
        onChange={(value) => onChange({ manual_url: value })}
      />
    </>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
