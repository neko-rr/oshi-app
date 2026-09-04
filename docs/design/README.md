<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# デザイン（エージェント・人間の入口）

**更新区分の凡例（全体）:** [docs/README.md](../README.md)  
見た目・UI/UX・テーマ色の **正本はここ**（`docs/db` / `docs/product` と同列）。  
旧 Dash の DESIGN / Bootswatch 計画は **ARCHIVE**（`.cursor/plans/archive/`）。新規設計の正にしない。

## 一言で言うと

| 何で作る | 内容 |
|----------|------|
| **UI/UX・動き** | ブランドの雰囲気・使いやすさ・推し活らしさ |
| **テーマ色** | 顧客が選ぶと `colors.css` のセマンティック変数 **一式**が切り替わる（[todo-app](https://github.com/neko-rr/todo-app) 方式）。既定は緑系 `default` |
| **部品の色** | hex／色名の直書き禁止。`bg-primary` 等のみ |

部品の土台は [shadcn/ui](https://ui.shadcn.com/)。実装トークンは `apps/web/src/styles/`。

## ファイルマップ

| ファイル | 役割 | 更新 |
|----------|------|------|
| [principles.md](principles.md) | 原則・トーン・Do/Don't | **手** |
| [tokens.md](tokens.md) | 色・字・余白・角・影の考え方 | **手** |
| [brand-palette.md](brand-palette.md) | ブランド既定色の種（初学者向け） | **手** |
| [components.md](components.md) | 部品の使い方（shadcn） | **手** |
| [themes.md](themes.md) | テーマ（トークン一式・todo-app 方式） | **手** |
| [oshi-accents.md](oshi-accents.md) | テーマ色／推し色（カラータグとの違い） | **手** |
| [compare-workflow.md](compare-workflow.md) | 3案並列・端末切替の手順 | **手** |
| [motion.md](motion.md) | 動き・フィードバック（短い有用反応／長い遊びは本線外） | **手** |
| [a11y.md](a11y.md) | アクセシビリティ要約（最新は公式 WebFetch） | **手** |
| [feedback/README.md](feedback/README.md) | 要望 inbox → pending → 採用 | **手** |
| [feedback/inbox.md](feedback/inbox.md) | 走り書きメモ | **手** |
| [feedback/decisions.md](feedback/decisions.md) | 決定ログ（accepted のみ） | **手** |
| [icons.md](icons.md) | lucide 採用一覧・ライセンス（表は sync 生成） | **手**（AUTO 外） |
| [meta/icons.json](meta/icons.json) | 採用 lucide **正本** | **エージェント** |
| [meta/tokens.json](meta/tokens.json) | セマンティック名 **正本**（check のみ） | **エージェント** |
| [meta/design_adoption.json](meta/design_adoption.json) | Lab → 本番採用状態 | **エージェント** |
| [meta/README.md](meta/README.md) | meta JSON の説明 | **手** |
| [generated/README.md](generated/README.md) | 自動出力の説明 | **手** |

ルートの薄い入口: [DESIGN.md](../../DESIGN.md)  
命令: `.cursor/rules/design.mdc`  
手順: skill **`design-change`** / 比較・スコア: skill **`design-lab`** / 本番採用: skill **`design-adoption`** / 要望・未決: skill **`design-feedback`** / a11y: skill **`design-a11y`** / モバイル: skill **`design-mobile`**

as-built（自動）: [generated/gaps.md](generated/gaps.md) ← `pnpm generate:design-docs`

## 読む順（あなた向け）

1. [principles.md](principles.md) … 雰囲気を何で作るか  
2. [themes.md](themes.md) … テーマ＝トークン一式  
3. [oshi-accents.md](oshi-accents.md) … カラータグとの違い  
4. [compare-workflow.md](compare-workflow.md) … 見た目を変えるときの手順（詳細は `design-lab`）  
5. [brand-palette.md](brand-palette.md) … `#9f606c` とは何か（詳細スケールは後回し）  
6. [feedback/README.md](feedback/README.md) … 気になることは **pending でよい**  
7. [a11y.md](a11y.md) … コントラスト・フォーカス（最新は skill `design-a11y`）

## フィードバック（pending でよい）

要望・違和感は [feedback/](feedback/) に蓄積。**すぐ決めなくてよい。**  
エージェントは skill **`design-feedback`** で `meta/feedback_items.json` に pending 記録 → 人が **accepted** した分だけ docs 更新。

## 製品・DB との境界

| 領域 | 正本 | メモ |
|------|------|------|
| 顧客価値・画面要否 | `docs/product/` | デザインの「好き嫌い」ではなく価値・DoD |
| カラータグ（製品ラベル） | DB + 設定 UI | **テーマ色（アプリ見た目）とは別用途**。枠数はそのまま |
| テーマ保存 API | `theme_settings` | `GET/PUT /theme-settings`。実装は `themes.md` |

## 実装の正（コード）

| 層 | 場所 |
|----|------|
| 生トークン | `apps/web/src/styles/colors.css`（`data-theme` ごと一式） |
| Tailwind 橋渡し | `apps/web/src/styles/tailwind-theme.css` |
| 部品 | `apps/web/src/components/ui/*`（shadcn） |
| 画面 | `apps/web/src/app/**` — トークン／部品のみ。hex 直書き禁止 |
