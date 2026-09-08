"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { API_PATHS } from "@oshi/shared";
import { createClient } from "@/lib/client";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { findResidenceRegion } from "@/lib/residencePrefs";
import { isLikelyOfflineError, networkUserMessage } from "@/lib/networkError";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { NetworkRetryNotice } from "@/components/feedback/NetworkRetryNotice";
import { TagChipPicker } from "@/components/tags/TagChipPicker";
import { CurrencyCodePicker } from "@/components/settings/CurrencyCodePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ColorTagItem = {
  slot: number;
  color_tag_name: string;
  color_tag_color: string;
};

type CategoryTagItem = {
  category_tag_id: number;
  category_tag_name: string;
  category_tag_color?: string;
  category_tag_icon?: string;
};

type StorageLocationItem = {
  storage_location_id: number;
  storage_location_name: string;
  storage_location_icon?: string;
};

type ExternalRef = {
  source: string;
  product_url: string;
  external_item_code?: string | null;
  shop_name?: string | null;
  label?: string | null;
  is_primary?: boolean;
};

type ProductDetail = {
  registered_product_id: number;
  product_name: string | null;
  product_group_name?: string | null;
  works_series_name?: string | null;
  title?: string | null;
  character_name?: string | null;
  purchase_price?: number | null;
  currency_code?: string | null;
  purchase_location?: string | null;
  purchase_date?: string | null;
  barcode_number?: string | null;
  memo?: string | null;
  registration_quantity?: number | null;
  sales_desired_flag?: number | boolean | null;
  sales_desired_quantity?: number | null;
  want_object_flag?: number | boolean | null;
  category_tag_id: number | null;
  storage_location_id: number | null;
  color_tag_slots: number[];
  external_refs?: ExternalRef[];
};

type Props = {
  registeredProductId: number;
  /** 削除後の戻り先（一覧クエリ付き可） */
  galleryHref?: string;
};

export function ProductDetailEditor({
  registeredProductId,
  galleryHref = "/gallery",
}: Props) {
  const router = useRouter();
  const t = useTranslations("ProductDetail");
  const tCommon = useTranslations("Common");
  const tGallery = useTranslations("Gallery");
  const { flashSuccess } = useFeedback();
  const { residenceRegion, keepAtHandCount, autoSalesDesired } =
    useDisplaySettings();
  const defaultCurrency = findResidenceRegion(residenceRegion).currencyCode;
  const [categories, setCategories] = useState<CategoryTagItem[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocationItem[]>([]);
  const [colors, setColors] = useState<ColorTagItem[]>([]);
  const [productName, setProductName] = useState("");
  const [productGroupName, setProductGroupName] = useState("");
  const [worksSeriesName, setWorksSeriesName] = useState("");
  const [title, setTitle] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [barcodeNumber, setBarcodeNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [registrationQuantity, setRegistrationQuantity] = useState("1");
  const [salesDesired, setSalesDesired] = useState(false);
  const [salesDesiredQuantity, setSalesDesiredQuantity] = useState("");
  const [wantObject, setWantObject] = useState(false);
  const [salesDesiredUserTouched, setSalesDesiredUserTouched] = useState(false);
  const [rakutenUrl, setRakutenUrl] = useState("");
  const [rakutenCode, setRakutenCode] = useState("");
  const [rakutenShop, setRakutenShop] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualLabel, setManualLabel] = useState("");
  const [categoryTagId, setCategoryTagId] = useState<number | null>(null);
  const [storageLocationId, setStorageLocationId] = useState<number | null>(
    null,
  );
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [errorOffline, setErrorOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const apiBase = useCallback(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) throw new Error(tGallery("apiBaseMissing"));
    return base.replace(/\/$/, "");
  }, [tGallery]);

  const getToken = useCallback(async () => {
    const supabase = createClient();
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session) {
      router.push("/auth/login");
      return null;
    }
    return data.session.access_token;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const headers = { Authorization: `Bearer ${token}` };
        const [catRes, recRes, colRes, detailRes] = await Promise.all([
          fetch(`${apiBase()}${API_PATHS.categoryTags}`, { headers }),
          fetch(`${apiBase()}${API_PATHS.storageLocations}`, { headers }),
          fetch(`${apiBase()}${API_PATHS.colorTags}`, { headers }),
          fetch(
            `${apiBase()}${API_PATHS.products}/${registeredProductId}`,
            { headers },
          ),
        ]);
        if (!catRes.ok || !recRes.ok || !colRes.ok || !detailRes.ok) {
          const bad = [catRes, recRes, colRes, detailRes].find((r) => !r.ok);
          const detail = bad ? (await bad.text()).slice(0, 160) : "";
          throw new Error(tCommon("loadFailedPrefix", { detail }));
        }
        const catJson = (await catRes.json()) as { items?: CategoryTagItem[] };
        const recJson = (await recRes.json()) as {
          items?: StorageLocationItem[];
        };
        const colJson = (await colRes.json()) as { items?: ColorTagItem[] };
        const detail = (await detailRes.json()) as ProductDetail;
        if (cancelled) return;
        setCategories(catJson.items ?? []);
        setStorageLocations(recJson.items ?? []);
        setColors(colJson.items ?? []);
        setProductName(detail.product_name?.trim() ?? "");
        setProductGroupName(detail.product_group_name?.trim() ?? "");
        setWorksSeriesName(detail.works_series_name?.trim() ?? "");
        setTitle(detail.title?.trim() ?? "");
        setCharacterName(detail.character_name?.trim() ?? "");
        setPurchasePrice(
          detail.purchase_price != null ? String(detail.purchase_price) : "",
        );
        setCurrencyCode(
          detail.currency_code?.trim() ||
            (detail.purchase_price != null ? defaultCurrency : ""),
        );
        setPurchaseLocation(detail.purchase_location?.trim() ?? "");
        setPurchaseDate(
          detail.purchase_date
            ? String(detail.purchase_date).slice(0, 10)
            : "",
        );
        setBarcodeNumber(detail.barcode_number?.trim() ?? "");
        setMemo(detail.memo ?? "");
        setRegistrationQuantity(
          detail.registration_quantity != null
            ? String(detail.registration_quantity)
            : "1",
        );
        const salesOn =
          detail.sales_desired_flag === true ||
          detail.sales_desired_flag === 1;
        setSalesDesired(salesOn);
        setSalesDesiredQuantity(
          detail.sales_desired_quantity != null
            ? String(detail.sales_desired_quantity)
            : "",
        );
        setWantObject(
          detail.want_object_flag === true || detail.want_object_flag === 1,
        );
        setSalesDesiredUserTouched(salesOn);
        const refs = detail.external_refs ?? [];
        const rakuten = refs.find((r) => r.source === "rakuten");
        const manual = refs.find((r) => r.source === "manual");
        setRakutenUrl(rakuten?.product_url?.trim() ?? "");
        setRakutenCode(rakuten?.external_item_code?.trim() ?? "");
        setRakutenShop(rakuten?.shop_name?.trim() ?? "");
        setManualUrl(manual?.product_url?.trim() ?? "");
        setManualLabel(manual?.label?.trim() ?? "");
        setCategoryTagId(
          detail.category_tag_id != null ? detail.category_tag_id : null,
        );
        setStorageLocationId(
          detail.storage_location_id != null
            ? detail.storage_location_id
            : null,
        );
        setSelectedSlots(new Set(detail.color_tag_slots ?? []));
      } catch (e: unknown) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : tCommon("loadFailed"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, defaultCurrency, getToken, registeredProductId, tCommon]);

  function toggleSlot(slot: number) {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const name = productName.trim();
    if (!name) {
      setError(t("productNameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    setErrorOffline(false);
    try {
      const token = await getToken();
      if (!token) return;
      const priceNum = purchasePrice.trim() ? Number(purchasePrice.trim()) : null;
      const hasPrice = priceNum != null && Number.isFinite(priceNum);
      let qty: number | null = null;
      const qtyRaw = registrationQuantity.trim();
      if (qtyRaw) {
        const q = Number(qtyRaw);
        if (Number.isInteger(q) && q >= 1) qty = q;
      }
      const ownedQty = qty ?? 1;
      let salesOn = salesDesired;
      let salesQty: number | null = null;
      const salesQtyRaw = salesDesiredQuantity.trim();
      if (salesQtyRaw) {
        const sq = Number(salesQtyRaw);
        if (Number.isInteger(sq) && sq >= 0) salesQty = sq;
      }
      if (!salesDesiredUserTouched && autoSalesDesired && ownedQty > keepAtHandCount) {
        salesOn = true;
        salesQty = ownedQty - keepAtHandCount;
      }
      const body: Record<string, unknown> = {
        product_name: name,
        product_group_name: productGroupName.trim(),
        works_series_name: worksSeriesName.trim(),
        title: title.trim(),
        character_name: characterName.trim(),
        purchase_location: purchaseLocation.trim(),
        purchase_date: purchaseDate.trim() || null,
        clear_purchase_date: !purchaseDate.trim(),
        barcode_number: barcodeNumber.trim(),
        memo: memo.trim(),
        purchase_price: hasPrice ? Math.trunc(priceNum) : null,
        currency_code: hasPrice
          ? currencyCode || defaultCurrency
          : null,
        registration_quantity: qty,
        sales_desired_flag: salesOn,
        sales_desired_quantity: salesOn ? salesQty : 0,
        want_object_flag: wantObject,
        sales_desired_user_touched: salesDesiredUserTouched,
        color_tag_slots: Array.from(selectedSlots).sort((a, b) => a - b),
      };
      if (categoryTagId != null) {
        body.category_tag_id = categoryTagId;
      } else {
        body.clear_category_tag = true;
      }
      if (storageLocationId != null) {
        body.storage_location_id = storageLocationId;
      } else {
        body.clear_storage_location = true;
      }

      const external_refs: ExternalRef[] = [];
      const rUrl = rakutenUrl.trim();
      const rCode = rakutenCode.trim();
      const rShop = rakutenShop.trim();
      if (rUrl && rCode && rShop) {
        external_refs.push({
          source: "rakuten",
          product_url: rUrl,
          external_item_code: rCode,
          shop_name: rShop,
          is_primary: true,
        });
      }
      const mUrl = manualUrl.trim();
      if (mUrl) {
        external_refs.push({
          source: "manual",
          product_url: mUrl,
          label: manualLabel.trim() || null,
          is_primary: external_refs.length === 0,
        });
      }
      body.external_refs = external_refs;

      const res = await fetch(
        `${apiBase()}${API_PATHS.products}/${registeredProductId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 160);
        throw new Error(tCommon("updateFailedPrefix", { detail }));
      }
      flashSuccess(tCommon("savedFlash"));
      router.refresh();
    } catch (err: unknown) {
      const offline = isLikelyOfflineError(err);
      setErrorOffline(offline);
      setError(
        networkUserMessage(err, {
          offline: tCommon("offlineHint"),
          fallback: tCommon("updateFailed"),
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(
        `${apiBase()}${API_PATHS.products}/${registeredProductId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 160);
        throw new Error(tCommon("deleteFailedPrefix", { detail }));
      }
      router.push(galleryHref);
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : tCommon("deleteFailed"),
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">{t("loadingForm")}</p>
    );
  }

  return (
    <form
      onSubmit={onSave}
      className="flex max-w-lg flex-col gap-4"
    >
      <h2 className="sr-only">{t("editorTitle")}</h2>

      <div className="grid gap-2">
        <Label htmlFor="detail_product_name">{t("productNameLabel")}</Label>
        <Input
          id="detail_product_name"
          required
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_product_group_name">{t("groupNameLabel")}</Label>
        <Input
          id="detail_product_group_name"
          value={productGroupName}
          onChange={(e) => setProductGroupName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_works_series">{t("worksSeriesNameLabel")}</Label>
        <Input
          id="detail_works_series"
          value={worksSeriesName}
          onChange={(e) => setWorksSeriesName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_title">{t("titleNameLabel")}</Label>
        <Input
          id="detail_title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_character_name">{t("characterNameLabel")}</Label>
        <Input
          id="detail_character_name"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_qty">{t("registrationQuantityLabel")}</Label>
        <Input
          id="detail_qty"
          type="number"
          min={1}
          max={999}
          inputMode="numeric"
          value={registrationQuantity}
          onChange={(e) => setRegistrationQuantity(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={salesDesired}
          onChange={(e) => {
            setSalesDesired(e.target.checked);
            setSalesDesiredUserTouched(true);
          }}
        />
        {t("salesDesiredLabel")}
      </label>
      {salesDesired ? (
        <div className="grid gap-2">
          <Label htmlFor="detail_sales_qty">
            {t("salesDesiredQuantityLabel")}
          </Label>
          <Input
            id="detail_sales_qty"
            type="number"
            min={0}
            max={999}
            inputMode="numeric"
            value={salesDesiredQuantity}
            onChange={(e) => {
              setSalesDesiredQuantity(e.target.value);
              setSalesDesiredUserTouched(true);
            }}
          />
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={wantObject}
          onChange={(e) => setWantObject(e.target.checked)}
        />
        {t("wantObjectLabel")}
      </label>

      <div className="grid gap-2">
        <Label htmlFor="detail_purchase_price">{t("purchasePriceLabel")}</Label>
        <Input
          id="detail_purchase_price"
          type="number"
          inputMode="numeric"
          value={purchasePrice}
          onChange={(e) => {
            const v = e.target.value;
            setPurchasePrice(v);
            if (v.trim() && !currencyCode) {
              setCurrencyCode(defaultCurrency);
            }
          }}
        />
      </div>

      <CurrencyCodePicker
        id="detail_currency_code"
        value={currencyCode || defaultCurrency}
        onChange={setCurrencyCode}
      />

      <div className="grid gap-2">
        <Label htmlFor="detail_purchase_location">
          {t("purchaseLocationLabel")}
        </Label>
        <Input
          id="detail_purchase_location"
          value={purchaseLocation}
          onChange={(e) => setPurchaseLocation(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_purchase_date">{t("purchaseDateLabel")}</Label>
        <Input
          id="detail_purchase_date"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_barcode_number">{t("barcodeLabel")}</Label>
        <Input
          id="detail_barcode_number"
          value={barcodeNumber}
          onChange={(e) => setBarcodeNumber(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_memo">{t("memoLabel")}</Label>
        <Input
          id="detail_memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <fieldset className="grid gap-3 rounded-lg border border-border p-3">
        <legend className="px-1 text-sm font-medium">
          {t("externalRefsTitle")}
        </legend>
        <p className="text-xs text-muted-foreground">{t("externalRefsHint")}</p>
        <div className="grid gap-2">
          <Label htmlFor="detail_rakuten_url">{t("rakutenUrlLabel")}</Label>
          <Input
            id="detail_rakuten_url"
            type="url"
            value={rakutenUrl}
            onChange={(e) => setRakutenUrl(e.target.value)}
          />
          {rakutenUrl.trim() ? (
            <a
              href={rakutenUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              {t("openExternalLink")}
            </a>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="detail_rakuten_code">{t("rakutenCodeLabel")}</Label>
          <Input
            id="detail_rakuten_code"
            value={rakutenCode}
            onChange={(e) => setRakutenCode(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="detail_rakuten_shop">{t("rakutenShopLabel")}</Label>
          <Input
            id="detail_rakuten_shop"
            value={rakutenShop}
            onChange={(e) => setRakutenShop(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="detail_manual_label">{t("manualLabelLabel")}</Label>
          <Input
            id="detail_manual_label"
            value={manualLabel}
            onChange={(e) => setManualLabel(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="detail_manual_url">{t("manualUrlLabel")}</Label>
          <Input
            id="detail_manual_url"
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
          />
        </div>
      </fieldset>

      <h3 className="pt-2 text-base font-medium">{t("tagsSection")}</h3>

      <TagChipPicker
        label={t("categoryTagLabel")}
        variant="category"
        value={categoryTagId}
        onChange={setCategoryTagId}
        options={categories.map((c) => ({
          id: c.category_tag_id,
          name: c.category_tag_name,
          icon: c.category_tag_icon,
          color: c.category_tag_color,
        }))}
      />

      <TagChipPicker
        label={t("storageLocationLabel")}
        variant="storage"
        value={storageLocationId}
        onChange={setStorageLocationId}
        options={storageLocations.map((r) => ({
          id: r.storage_location_id,
          name: r.storage_location_name,
          icon: r.storage_location_icon,
        }))}
      />

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{t("colorTagsLegend")}</legend>
        {colors.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("colorTagsEmpty")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {colors.map((c) => (
              <label
                key={c.slot}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedSlots.has(c.slot)}
                  onChange={() => toggleSlot(c.slot)}
                />
                <span
                  className="inline-block h-3 w-3 rounded border border-border"
                  style={{ backgroundColor: c.color_tag_color }}
                  aria-hidden
                />
                {t("colorTagSlot", { name: c.color_tag_name, slot: c.slot })}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {error ? (
        <NetworkRetryNotice
          message={error}
          offline={errorOffline}
          onRetry={() => {
            const fake = { preventDefault() {} } as FormEvent;
            void onSave(fake);
          }}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving || deleting}>
          {saving ? tCommon("saving") : tCommon("saveAction")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={saving || deleting}
          onClick={() => void onDelete()}
        >
          {deleting ? tCommon("deleting") : t("deleteProduct")}
        </Button>
      </div>
    </form>
  );
}
