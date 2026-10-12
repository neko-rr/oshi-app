/** ギャラリー編集モードの下書きと比較・保存ボディ。 */

import type { ProductEditListItem, ProductExternalRefSummary } from "@oshi/shared";

export type GalleryEditDraft = {
  product_name: string;
  product_group_name: string;
  works_series_name: string;
  title: string;
  character_name: string;
  purchase_price: string;
  currency_code: string;
  purchase_location: string;
  purchase_date: string;
  barcode_number: string;
  memo: string;
  registration_quantity: string;
  sales_desired: boolean;
  sales_desired_quantity: string;
  want_object: boolean;
  sales_desired_user_touched: boolean;
  category_tag_id: number | null;
  storage_location_id: number | null;
  color_tag_slots: number[];
  rakuten_url: string;
  rakuten_code: string;
  rakuten_shop: string;
  manual_url: string;
  manual_label: string;
};

export type GalleryEditPatch =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; error: "name" };

function flagOn(value: number | boolean | null | undefined): boolean {
  return value === true || value === 1;
}

function sortedSlots(slots: number[] | null | undefined): number[] {
  return [...(slots ?? [])].filter((n) => Number.isInteger(n)).sort((a, b) => a - b);
}

function refOf(
  refs: ProductExternalRefSummary[] | null | undefined,
  source: string,
): ProductExternalRefSummary | undefined {
  return (refs ?? []).find((ref) => ref.source === source);
}

/** 一覧の編集行から入力の初期値を作る。 */
export function draftFromEditItem(
  item: ProductEditListItem,
  defaultCurrency = "",
): GalleryEditDraft {
  const rakuten = refOf(item.external_refs, "rakuten");
  const manual = refOf(item.external_refs, "manual");
  const salesOn = flagOn(item.sales_desired_flag);
  const price =
    item.purchase_price != null ? String(item.purchase_price) : "";
  return {
    product_name: item.product_name?.trim() ?? "",
    product_group_name: item.product_group_name?.trim() ?? "",
    works_series_name: item.works_series_name?.trim() ?? "",
    title: item.title?.trim() ?? "",
    character_name: item.character_name?.trim() ?? "",
    purchase_price: price,
    currency_code:
      item.currency_code?.trim() || (price ? defaultCurrency : ""),
    purchase_location: item.purchase_location?.trim() ?? "",
    purchase_date: item.purchase_date
      ? String(item.purchase_date).slice(0, 10)
      : "",
    barcode_number: item.barcode_number?.trim() ?? "",
    memo: item.memo ?? "",
    registration_quantity:
      item.registration_quantity != null
        ? String(item.registration_quantity)
        : "1",
    sales_desired: salesOn,
    sales_desired_quantity:
      item.sales_desired_quantity != null
        ? String(item.sales_desired_quantity)
        : "",
    want_object: flagOn(item.want_object_flag),
    sales_desired_user_touched: salesOn,
    category_tag_id: item.category_tag_id ?? null,
    storage_location_id: item.storage_location_id ?? null,
    color_tag_slots: sortedSlots(item.color_tag_slots),
    rakuten_url: rakuten?.product_url?.trim() ?? "",
    rakuten_code: rakuten?.external_item_code?.trim() ?? "",
    rakuten_shop: rakuten?.shop_name?.trim() ?? "",
    manual_url: manual?.product_url?.trim() ?? "",
    manual_label: manual?.label?.trim() ?? "",
  };
}

function comparable(draft: GalleryEditDraft): GalleryEditDraft {
  return {
    ...draft,
    product_name: draft.product_name.trim(),
    color_tag_slots: sortedSlots(draft.color_tag_slots),
  };
}

export function editDraftsEqual(
  left: GalleryEditDraft,
  right: GalleryEditDraft,
): boolean {
  return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right));
}

/** 項目か未保存の回転があれば変更あり。 */
export function isEditRowDirty(
  baseline: GalleryEditDraft,
  draft: GalleryEditDraft,
  hasPendingPhoto: boolean,
): boolean {
  if (hasPendingPhoto) return true;
  return !editDraftsEqual(baseline, draft);
}

/** 詳細編集と同じ PATCH ボディ。製品名が空なら保存しない。 */
export function patchBodyFromEditDraft(
  draft: GalleryEditDraft,
  defaultCurrency: string,
): GalleryEditPatch {
  const name = draft.product_name.trim();
  if (!name) return { ok: false, error: "name" };

  const priceNum = draft.purchase_price.trim()
    ? Number(draft.purchase_price.trim())
    : null;
  const hasPrice = priceNum != null && Number.isFinite(priceNum);
  let qty: number | null = null;
  const qtyRaw = draft.registration_quantity.trim();
  if (qtyRaw) {
    const parsed = Number(qtyRaw);
    if (Number.isInteger(parsed) && parsed >= 1) qty = parsed;
  }
  let salesQty: number | null = null;
  const salesQtyRaw = draft.sales_desired_quantity.trim();
  if (salesQtyRaw) {
    const parsed = Number(salesQtyRaw);
    if (Number.isInteger(parsed) && parsed >= 0) salesQty = parsed;
  }

  const body: Record<string, unknown> = {
    product_name: name,
    product_group_name: draft.product_group_name.trim(),
    works_series_name: draft.works_series_name.trim(),
    title: draft.title.trim(),
    character_name: draft.character_name.trim(),
    purchase_location: draft.purchase_location.trim(),
    purchase_date: draft.purchase_date.trim() || null,
    clear_purchase_date: !draft.purchase_date.trim(),
    barcode_number: draft.barcode_number.trim(),
    memo: draft.memo.trim(),
    purchase_price: hasPrice ? Math.trunc(priceNum) : null,
    currency_code: hasPrice ? draft.currency_code || defaultCurrency : null,
    registration_quantity: qty,
    sales_desired_flag: draft.sales_desired,
    sales_desired_quantity: draft.sales_desired ? salesQty : 0,
    want_object_flag: draft.want_object,
    sales_desired_user_touched: draft.sales_desired_user_touched,
    color_tag_slots: sortedSlots(draft.color_tag_slots),
  };
  if (draft.category_tag_id != null) {
    body.category_tag_id = draft.category_tag_id;
  } else {
    body.clear_category_tag = true;
  }
  if (draft.storage_location_id != null) {
    body.storage_location_id = draft.storage_location_id;
  } else {
    body.clear_storage_location = true;
  }

  const externalRefs: ProductExternalRefSummary[] = [];
  const rakutenUrl = draft.rakuten_url.trim();
  const rakutenCode = draft.rakuten_code.trim();
  const rakutenShop = draft.rakuten_shop.trim();
  if (rakutenUrl && rakutenCode && rakutenShop) {
    externalRefs.push({
      source: "rakuten",
      product_url: rakutenUrl,
      external_item_code: rakutenCode,
      shop_name: rakutenShop,
      is_primary: true,
    });
  }
  const manualUrl = draft.manual_url.trim();
  if (manualUrl) {
    externalRefs.push({
      source: "manual",
      product_url: manualUrl,
      label: draft.manual_label.trim() || null,
      is_primary: externalRefs.length === 0,
    });
  }
  body.external_refs = externalRefs;
  return { ok: true, body };
}

/** 同時実行数を抑えて順に消化する。 */
export async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  const queue = [...items];
  const size = Math.max(1, Math.min(limit, queue.length));
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (next === undefined) return;
        await worker(next);
      }
    }),
  );
}
