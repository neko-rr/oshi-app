/** 画面用の再エクスポート。正本は packages/shared。 */
import {
  isProductColorCode,
  sortProductColorCodes,
  type ProductColorCode,
} from "@oshi/shared";

export {
  PRODUCT_COLOR_CODES,
  PRODUCT_COLOR_HEX,
  isProductColorCode,
  matchProductColorCodes,
  sortProductColorCodes,
  type ProductColorCode,
} from "@oshi/shared";

/** 手で色を付ける／外す。写真の自動判定とは別に、押した色だけを足し引きする。 */
export function toggleProductColorCode(
  selected: readonly string[],
  code: string,
): ProductColorCode[] {
  if (!isProductColorCode(code)) return sortProductColorCodes([...selected]);
  const next = selected.includes(code)
    ? selected.filter((item) => item !== code)
    : [...selected, code];
  return sortProductColorCodes(next);
}
