/**
 * Design Lab・案A/B/C 見本内の UI 部品番号（会話用）。
 * 「案Aの⑦の角を丸くして」のように指示するための固定番号。
 * 同じ論理部品は案が違っても同じ番号（無い案では出さない）。
 */

import type { LabSceneId } from "@/components/design-lab/lab-meta";

export const LAB_UI_CALLOUT_STORAGE_KEY = "oshiapp:design-lab:ui-callouts";

export type LabUiCalloutId =
  | "back"
  | "title"
  | "description"
  | "hero"
  | "preview_panel"
  | "preview_body"
  | "preview_muted"
  | "preview_primary"
  | "preview_secondary"
  | "preview_soft"
  | "swatches"
  | "status"
  | "help"
  | "section_current"
  | "section_pick"
  | "header_brand"
  | "header_nav"
  | "header_logout"
  | "home_heading"
  | "home_sub"
  | "home_badge"
  | "home_primary"
  | "home_secondary"
  | "home_grid"
  | "oshi_picker"
  | "search"
  | "chips"
  | "register_cta"
  | "card"
  | "card_photo"
  | "card_title"
  | "card_meta"
  | "load_more"
  | "detail_back"
  | "detail_photo"
  | "detail_title"
  | "detail_edit"
  | "bottom_tabs"
  | "shell_body";

export type LabUiCalloutMeta = {
  id: LabUiCalloutId;
  /** 1 始まり。① = 1。番号は既存をずらさず末尾追加。 */
  n: number;
  label: string;
};

/** 全シーン共通の番号台帳（シーンに無い部品は表示しないだけ）。 */
export const LAB_UI_CALLOUTS: readonly LabUiCalloutMeta[] = [
  { id: "back", n: 1, label: "戻る／設定リンク" },
  { id: "title", n: 2, label: "見出し" },
  { id: "description", n: 3, label: "説明文" },
  { id: "hero", n: 4, label: "ヒーロー／強調帯" },
  { id: "preview_panel", n: 5, label: "プレビュー枠" },
  { id: "preview_body", n: 6, label: "プレビュー本文" },
  { id: "preview_muted", n: 7, label: "プレビュー補助文" },
  { id: "preview_primary", n: 8, label: "主ボタン" },
  { id: "preview_secondary", n: 9, label: "副ボタン" },
  { id: "preview_soft", n: 10, label: "ソフト面／チップ面" },
  { id: "swatches", n: 11, label: "テーマ選択（スウォッチ／一覧）" },
  { id: "status", n: 12, label: "状態・選択中ヒント" },
  { id: "help", n: 13, label: "補足テキスト" },
  { id: "section_current", n: 14, label: "セクション：いまの見た目" },
  { id: "section_pick", n: 15, label: "セクション：テーマを選ぶ" },
  { id: "header_brand", n: 16, label: "ヘッダー・ブランド" },
  { id: "header_nav", n: 17, label: "ヘッダー・ナビ" },
  { id: "header_logout", n: 18, label: "ヘッダー・ログアウト" },
  { id: "home_heading", n: 19, label: "ホーム見出し" },
  { id: "home_sub", n: 20, label: "ホーム補助文" },
  { id: "home_badge", n: 21, label: "バッジ" },
  { id: "home_primary", n: 22, label: "ホーム主CTA" },
  { id: "home_secondary", n: 23, label: "ホーム副CTA" },
  { id: "home_grid", n: 24, label: "ホーム一覧グリッド" },
  { id: "oshi_picker", n: 25, label: "推し色ピッカー" },
  { id: "search", n: 26, label: "検索欄" },
  { id: "chips", n: 27, label: "絞り込みチップ" },
  { id: "register_cta", n: 28, label: "登録CTA" },
  { id: "card", n: 29, label: "商品カード（代表）" },
  { id: "card_photo", n: 30, label: "カード写真" },
  { id: "card_title", n: 31, label: "カード名" },
  { id: "card_meta", n: 32, label: "カードメタ／タグ" },
  { id: "load_more", n: 33, label: "もっと見る" },
  { id: "detail_back", n: 34, label: "詳細・戻る" },
  { id: "detail_photo", n: 35, label: "詳細写真" },
  { id: "detail_title", n: 36, label: "詳細タイトル" },
  { id: "detail_edit", n: 37, label: "詳細・編集ブロック" },
  { id: "bottom_tabs", n: 38, label: "下部タブ" },
  { id: "shell_body", n: 39, label: "シェル本文" },
] as const;

const BY_ID = Object.fromEntries(
  LAB_UI_CALLOUTS.map((m) => [m.id, m]),
) as Record<LabUiCalloutId, LabUiCalloutMeta>;

/** シーンごとに「いま出ている番号」の説明用（代表セット）。 */
export const LAB_UI_CALLOUT_IDS_BY_SCENE: Record<
  LabSceneId,
  readonly LabUiCalloutId[]
> = {
  "theme-settings": [
    "back",
    "title",
    "description",
    "hero",
    "preview_panel",
    "preview_body",
    "preview_muted",
    "preview_primary",
    "preview_secondary",
    "preview_soft",
    "swatches",
    "status",
    "help",
    "section_current",
    "section_pick",
  ],
  home: [
    "header_brand",
    "header_nav",
    "header_logout",
    "home_heading",
    "home_sub",
    "home_badge",
    "home_primary",
    "home_secondary",
    "home_grid",
    "oshi_picker",
    "bottom_tabs",
  ],
  "app-shell": ["header_brand", "shell_body", "bottom_tabs"],
  gallery: [
    "header_brand",
    "header_nav",
    "title",
    "description",
    "register_cta",
    "search",
    "chips",
    "card",
    "card_photo",
    "card_title",
    "card_meta",
    "load_more",
    "bottom_tabs",
  ],
  "gallery-detail": [
    "header_brand",
    "detail_back",
    "detail_photo",
    "detail_title",
    "chips",
    "detail_edit",
    "bottom_tabs",
  ],
};

export function circledNumber(n: number): string {
  if (Number.isInteger(n) && n >= 1 && n <= 20) {
    return String.fromCharCode(0x245f + n);
  }
  if (Number.isInteger(n) && n >= 21 && n <= 35) {
    // ㉑ U+3251 = 12881 … ㉟
    return String.fromCharCode(0x3251 + (n - 21));
  }
  if (Number.isInteger(n) && n >= 36 && n <= 50) {
    // ㊱ U+32B1 …
    return String.fromCharCode(0x32b1 + (n - 36));
  }
  return `(${n})`;
}

export function labUiCalloutMeta(
  id: LabUiCalloutId,
): LabUiCalloutMeta | undefined {
  return BY_ID[id];
}

export function labUiCalloutGlyph(id: LabUiCalloutId): string {
  const m = BY_ID[id];
  return m ? circledNumber(m.n) : "";
}

export function listSceneUiCallouts(scene: LabSceneId): LabUiCalloutMeta[] {
  const ids = LAB_UI_CALLOUT_IDS_BY_SCENE[scene] ?? [];
  return ids
    .map((id) => BY_ID[id])
    .filter((m): m is LabUiCalloutMeta => m != null);
}

export function readUiCalloutsVisible(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(LAB_UI_CALLOUT_STORAGE_KEY);
    if (raw == null) return true;
    return raw === "1" || raw === "true";
  } catch {
    return true;
  }
}

export function writeUiCalloutsVisible(visible: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAB_UI_CALLOUT_STORAGE_KEY, visible ? "1" : "0");
  } catch {
    /* ignore */
  }
}
