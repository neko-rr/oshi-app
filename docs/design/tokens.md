<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# トークン（色・字・余白・角）

実装の名前は shadcn / Tailwind のセマンティック変数に合わせる。  
数値の最終確定は Design Lab 採用後に `colors.css` と同期する（フェーズ1以降）。  
**名前の正本:** [meta/tokens.json](meta/tokens.json)。検査: `python scripts/check_design_tokens.py`（値の自動生成はまだしない）。

## 色の考え方

| 層 | 変えるもの | 誰が触る |
|----|------------|----------|
| テーマパック | `colors.css` のセマンティック変数 **一式**（`data-theme`） | 顧客（`/settings/theme`） |
| ブランド種 | 将来のブランド印象の出発点 | 開発（[brand-palette.md](brand-palette.md)、スケールは後回し） |
| カラータグ | 製品ラベル色（別系統） | 顧客（`/settings/color-tags`） |

正本: [themes.md](themes.md)（[todo-app](https://github.com/neko-rr/todo-app) 方式）。  
部品には hex／色名を直書きせず、セマンティック名だけを使う。

## セマンティック名（実装と揃える）

| 変数（例） | 用途 |
|------------|------|
| `--background` / `--foreground` | 画面の地と本文 |
| `--card` / `--card-foreground` | カード面 |
| `--primary` / `--primary-foreground` | 主なボタン・強調（テーマの一部） |
| `--muted` / `--muted-foreground` | 補助テキスト・薄い面 |
| `--border` / `--input` / `--ring` | 線・入力・フォーカス |
| `--destructive` | 削除など危険操作 |

橋渡し: `apps/web/src/styles/tailwind-theme.css`  
生定義: `apps/web/src/styles/colors.css`

## タイポ・余白・角（方針のみ）

| 項目 | 方針 |
|------|------|
| 本文 | 読みやすいサンセリフ。日本語が欠けない行間 |
| 見出し | 本文より少し大きく。ブランド名を押しつぶさない |
| 余白 | 8px 系。ギャラリーは余白多め |
| 角 | 柔らかめ（sharp すぎない）。数値は Lab 後に固定 |
| タッチ | 主要操作は指で押しやすい大きさ |

## 顧客向け表示プリセット（`display_settings`）

`/settings/theme`（見た目）で変更。実装: `apps/web/src/styles/display-prefs.css`。  
**全ページ適用:** `AppPreferencesRoot`（テーマ=`ThemeRoot`、文字・密度=`DisplaySettingsRoot`）。初回描画前は layout のブート script が localStorage を `html` に載せる。

| 軸 | 段階 | 既定 | 効果 |
|----|------|------|------|
| `text_scale`（文字の大きさ） | 1〜7 | 3（×1.0） | `html` の `font-size` 倍率（0.875〜1.375） |
| `ui_density`（UI密度） | 1〜7 | 4 | 行間・main／ギャラリー余白（つめつめ←→ゆったり） |
| `list_sort`（一覧の並び） | `newest` / `name` / `created_at` | `newest` | ギャラリー・検索の既定ソート |
| `gallery_layout`（ギャラリー表示） | `grid` / `large` / `list` | `grid` | 写真主役グリッド／大きめ／リスト |
| `landing_page`（ログイン後の着地） | `home` / `gallery` / `register` | `home` | `/`・`/gallery`・`/register` |
| テーマ | パック ID | `default` | `html[data-theme]` でセマンティック色一式 |

値は離散のみ（連続スライダーの生値は保存しない）。ドラッグ中も即 CSS 反映。

## まだやらないこと

- ブランド色 `#9f606c` の 50〜950 全スケールの文書化（後回し）  
- テーマ UI のスウォッチ化（任意。適用範囲は常にトークン一式）
