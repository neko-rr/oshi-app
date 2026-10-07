<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# テーマ（セマンティック・トークン一式）

参考実装: [todo-app](https://github.com/neko-rr/todo-app) の `colors.css` + `ThemePicker` + `data-theme`。

## 目的

ユーザーがテーマを選ぶと、**部品が使う色トークン全体**（背景・文字・カード・ボーダー・primary・ring 等）が切り替わること。  
コンポーネントには色名や `#RRGGBB` を直書きせず、`bg-primary` / `text-muted-foreground` などの **セマンティック名だけ**を使う。

## 仕組み

| 層 | 役割 |
|----|------|
| `apps/web/src/styles/colors.css` | `data-theme="…"` ごとに **色**トークン一式を定義（`--font-*` は置かない） |
| `tailwind-theme.css` | `--primary` 等 → Tailwind `--color-*` へ橋渡し |
| UI 部品 | `bg-primary` 等のみ（hex 禁止に近い運用） |
| 保存 | FastAPI `GET/PUT /theme-settings` → `theme_settings.theme` |

`<select>` でテーマ ID を選び、`document.documentElement` の `data-theme` を切り替える。**これが意図した簡単さ**であり、accent だけ差し替える方式ではない。

**文字（フォント）はテーマ色とは別軸。** 正は `display_settings.font_pack` → `html[data-font-pack]` → `apps/web/src/styles/font-packs.css`（[tokens.md](tokens.md)）。

## 既定

| ID | 内容 |
|----|------|
| `default` | **緑系**（`:root` と同値）。未選択・初回・レガシー値のフォールバック |

Dash / Bootswatch 名（`minty` / `quartz` / `morph` 等）は **使わない**。残存値は `default` に寄せる。

## 推し色ドキュメントとの関係

テーマパック自体を「`--primary` / `--ring` だけ差し替え」で済ませるのは **誤り**。  
本番のテーマの正は **本ファイル＋ todo-app 方式のフル・トークンパック**。

**テーマ色の検討用 Lab:** `/dev/design-lab/theme-colors`（シード→スケール・部品見本。[UI Colors](https://uicolors.app/generate/790c1e) に近い確認用。採用後は `colors.css` を人手更新）。

それとは別に、顧客の **推し色（メイン＋サブ）** がパックの上に限定オーバーレイする機能がある。  
詳細・境界は [oshi-accents.md](oshi-accents.md)。キャンバス `--background` はパック側のまま。

## トーン強度・マスコット（見た目設定の別軸）

テーマパック切替とは別に、見た目設定（`/settings/theme`）で扱う予定の軸:

| 軸 | 内容 | 正本 |
|----|------|------|
| トーン強度 | **落ち着き**／**推し活フル**（手動本線。時間・曜日自動は任意・既定オフ） | [principles.md](principles.md)（fb-006 accepted） |
| マスコット | 既定 **風ねこ**。全候補＋`none`（キャラ無し通常 UI）を選択可 | [mascots.md](mascots.md) · `/settings/theme` |

色トークン一式の切替ロジックとは混ぜない。強度・マスコットは装飾量の制御。

## 関連

- トークン名検査: [tokens.md](tokens.md) / `meta/tokens.json`
- 推し色オーバーレイ: [oshi-accents.md](oshi-accents.md)
- ブランド種（別議論）: [brand-palette.md](brand-palette.md)
