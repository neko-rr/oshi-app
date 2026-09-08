import { API_PATHS } from "@oshi/shared";

export type DuplicateHintSample = {
  registered_product_id: number;
  product_name: string | null;
  registration_quantity?: number | null;
};

export type DuplicateHintsResponse = {
  match_count: number;
  total_quantity: number;
  sample: DuplicateHintSample | null;
  barcode?: string | null;
  external_item_code?: string | null;
};

/** barcode または楽天 item_code で自分の所持ヒントを取得 */
export async function fetchDuplicateHints(params: {
  apiBase: string;
  accessToken: string;
  barcode?: string | null;
  externalItemCode?: string | null;
  signal?: AbortSignal;
}): Promise<DuplicateHintsResponse> {
  const barcode = (params.barcode || "").trim();
  const itemCode = (params.externalItemCode || "").trim();
  if (!barcode && !itemCode) {
    return { match_count: 0, total_quantity: 0, sample: null };
  }
  const base = params.apiBase.replace(/\/$/, "");
  const qs = new URLSearchParams();
  if (barcode) qs.set("barcode", barcode);
  if (itemCode) qs.set("external_item_code", itemCode);
  const res = await fetch(
    `${base}${API_PATHS.productsDuplicateHints}?${qs.toString()}`,
    {
      headers: { Authorization: `Bearer ${params.accessToken}` },
      signal: params.signal,
    },
  );
  if (!res.ok) {
    throw new Error("所持ヒントの取得に失敗しました");
  }
  return (await res.json()) as DuplicateHintsResponse;
}
