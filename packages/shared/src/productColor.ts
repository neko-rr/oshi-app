/** グッズの色。カラータグとは別の固定分類。複数選択。多色は持たない。 */

export const PRODUCT_COLOR_CODES = [
  "white",
  "black",
  "gray",
  "red",
  "pink",
  "orange",
  "yellow",
  "green",
  "blue",
  "light_blue",
  "purple",
  "brown",
  "beige",
  "gold",
  "silver",
] as const;

export type ProductColorCode = (typeof PRODUCT_COLOR_CODES)[number];

export const PRODUCT_COLOR_HEX: Record<ProductColorCode, string> = {
  white: "#f4f4f5",
  black: "#18181b",
  gray: "#a1a1aa",
  red: "#dc3545",
  pink: "#ec4899",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#2563eb",
  light_blue: "#38bdf8",
  purple: "#7c3aed",
  brown: "#92400e",
  beige: "#d6c4a8",
  gold: "#d4a017",
  silver: "#c0c7ce",
};

const ALIAS: ReadonlyArray<readonly [string, ProductColorCode]> = [
  ["white", "white"],
  ["ホワイト", "white"],
  ["白", "white"],
  ["ブラック", "black"],
  ["黒", "black"],
  ["black", "black"],
  ["グレー", "gray"],
  ["グレイ", "gray"],
  ["灰色", "gray"],
  ["gray", "gray"],
  ["grey", "gray"],
  ["レッド", "red"],
  ["赤", "red"],
  ["red", "red"],
  ["ピンク", "pink"],
  ["桃色", "pink"],
  ["pink", "pink"],
  ["オレンジ", "orange"],
  ["橙色", "orange"],
  ["橙", "orange"],
  ["orange", "orange"],
  ["黄色", "yellow"],
  ["イエロー", "yellow"],
  ["黄", "yellow"],
  ["yellow", "yellow"],
  ["グリーン", "green"],
  ["黄緑", "green"],
  ["緑", "green"],
  ["green", "green"],
  ["ライトブルー", "light_blue"],
  ["水色", "light_blue"],
  ["空色", "light_blue"],
  ["シアン", "light_blue"],
  ["cyan", "light_blue"],
  ["lightblue", "light_blue"],
  ["skyblue", "light_blue"],
  ["ブルー", "blue"],
  ["ネイビー", "blue"],
  ["紺", "blue"],
  ["navy", "blue"],
  ["青", "blue"],
  ["blue", "blue"],
  ["パープル", "purple"],
  ["ラベンダー", "purple"],
  ["紫", "purple"],
  ["purple", "purple"],
  ["ブラウン", "brown"],
  ["茶色", "brown"],
  ["茶", "brown"],
  ["brown", "brown"],
  ["ベージュ", "beige"],
  ["クリーム", "beige"],
  ["生成り", "beige"],
  ["beige", "beige"],
  ["cream", "beige"],
  ["ゴールド", "gold"],
  ["金色", "gold"],
  ["金", "gold"],
  ["gold", "gold"],
  ["シルバー", "silver"],
  ["銀色", "silver"],
  ["銀", "silver"],
  ["silver", "silver"],
];

const EXACT = new Map(ALIAS);
const BY_LENGTH = [...ALIAS].sort((a, b) => b[0].length - a[0].length);

function normLabel(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s　]/g, "");
}

export function isProductColorCode(value: string): value is ProductColorCode {
  return (PRODUCT_COLOR_CODES as readonly string[]).includes(value);
}

/** 写真の色名をカタログへ。多色は捨て、一致した色は複数返す。 */
export function matchProductColorCodes(labels: string[]): ProductColorCode[] {
  const found = new Set<ProductColorCode>();
  for (const raw of labels) {
    const norm = normLabel(raw);
    if (!norm) continue;
    const exact = EXACT.get(norm);
    if (exact) {
      found.add(exact);
      continue;
    }
    for (const [alias, code] of BY_LENGTH) {
      if (norm.includes(alias)) found.add(code);
    }
  }
  return PRODUCT_COLOR_CODES.filter((code) => found.has(code));
}

export function sortProductColorCodes(codes: string[]): ProductColorCode[] {
  const found = new Set(codes.filter(isProductColorCode));
  return PRODUCT_COLOR_CODES.filter((code) => found.has(code));
}
