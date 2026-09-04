<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# テーマ（セマンティック・トークン一式）

参考実装: [todo-app](https://github.com/neko-rr/todo-app) の `colors.css` + `ThemePicker` + `data-theme`。

## 目的

ユーザーがテーマを選ぶと、**部品が使う色トークン全体**（背景・文字・カード・ボーダー・primary・ring 等）が切り替わること。  
コンポーネントには色名や `#RRGGBB` を直書きせず、`bg-primary` / `text-muted-foreground` などの **セマンティック名だけ**を使う。

## 仕組み

| 層 | 役割 |
|----|------|
| `apps/web/src/styles/colors.css` | `data-theme="…"` ごとに CSS 変数一式を定義 |
| `tailwind-theme.css` | `--primary` 等 → Tailwind `--color-*` へ橋渡し |
| UI 部品 | `bg-primary` 等のみ（hex 禁止に近い運用） |
| 保存 | FastAPI `GET/PUT /theme-settings` → `theme_settings.theme` |

`<select>` でテーマ ID を選び、`document.documentElement` の `data-theme` を切り替える。**これが意図した簡単さ**であり、accent だけ差し替える方式ではない。

## 既定

| ID | 内容 |
|----|------|
| `default` | **緑系**（`:root` と同値）。未選択・初回・レガシー値のフォールバック |

Dash / Bootswatch 名（`minty` / `quartz` / `morph` 等）は **使わない**。残存値は `default` に寄せる。

## 推し色ドキュメントとの関係

テーマパック自体を「`--primary` / `--ring` だけ差し替え」で済ませるのは **誤り**。  
本番のテーマの正は **本ファイル＋ todo-app 方式のフル・トークンパック**。

それとは別に、顧客の **推し色（メイン＋サブ）** がパックの上に限定オーバーレイする機能がある。  
詳細・境界は [oshi-accents.md](oshi-accents.md)。キャンバス `--background` はパック側のまま。

## 関連

- トークン名検査: [tokens.md](tokens.md) / `meta/tokens.json`
- 推し色オーバーレイ: [oshi-accents.md](oshi-accents.md)
- ブランド種（別議論）: [brand-palette.md](brand-palette.md)
