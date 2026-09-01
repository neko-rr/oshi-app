import {
  API_PATHS,
  type ProductListItem,
  type ProductListResponse,
} from "@oshi/shared";

/**
 * 自分のリストに同じバーコードがあるか（購入済み判定の土台）。
 * カメラ読取後や将来の「店頭スキャン」から再利用する。
 */
export async function findOwnedProductsByBarcode(params: {
  apiBase: string;
  accessToken: string;
  barcode: string;
  signal?: AbortSignal;
}): Promise<ProductListItem[]> {
  const code = params.barcode.trim();
  if (!code) return [];
  const base = params.apiBase.replace(/\/$/, "");
  const url = `${base}${API_PATHS.products}?barcode=${encodeURIComponent(code)}&limit=10`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${params.accessToken}` },
    signal: params.signal,
  });
  if (!res.ok) {
    throw new Error("購入済みチェックに失敗しました");
  }
  const json = (await res.json()) as ProductListResponse;
  return json.items ?? [];
}
