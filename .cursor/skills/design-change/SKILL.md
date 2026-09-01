---
name: design-change
description: >-
  Web UI・デザイントークン・推し色・モーション・docs/design を触る前と後に適用する。
  見た目変更、テーマ、shadcn 部品、ブランド色のとき必須。3案比較は design-lab。
---

# デザイン変更（oshi_app）

## いつ使うか（必須）

- `apps/web` の見た目・レイアウト・モーション
- `apps/web/src/styles/` のトークン
- `docs/design/` / ルート `DESIGN.md`
- 推し色 UI・テーマ・shadcn 部品の追加
- 「女性らしい／推し活らしい」見た目の相談・実装

**3案並列・スコア・本決定前の比較**は skill **`design-lab`**（こちらを先に）。

## 正本マップ

| 何 | どこ |
|----|------|
| 入口 | `docs/design/README.md` |
| 原則 | `docs/design/principles.md` |
| シェル | `docs/design/themes.md`（テーマ＝トークン一式） |
| 推し色・境界 | `docs/design/oshi-accents.md` |
| 動き | `docs/design/motion.md` |
| 3案比較（人向け） | `docs/design/compare-workflow.md` |
| 3案比較（手順） | skill **`design-lab`** |
| フィードバック | `docs/design/feedback/` / `docs/design/meta/feedback_items.json` |
| 本番採用状態 | `docs/design/meta/design_adoption.json` |
| a11y | `docs/design/a11y.md` / skill **`design-a11y`** |
| アイコン | `docs/design/icons.md` / **`docs/design/meta/icons.json`（正本）** |
| ブランド種 | `docs/design/brand-palette.md` |
| 命令 | `.cursor/rules/design.mdc` |
| 実装トークン | `apps/web/src/styles/` |
| 部品 | `apps/web/src/components/ui/`（shadcn） |

## 着手前

1. `docs/design/principles.md` を読む（雰囲気は UI/UX・動き。配置が先・色は次）
2. skill **`design-feedback`** で `feedback_items.json` の **pending** を確認（accepted 以外を本番反映しない）
3. 色の話なら `themes.md`（トークン一式）と `oshi-accents.md`（カラータグ分離）を確認
4. 大きな見た目変更なら **`design-lab`**（実装3案＋端末切替＋スコア。A からテーマ色を外さない）
5. Lab 本決定後の画面反映は **`design-adoption`**（一括禁止）
6. 色・フォーカス・モーションなら **`design-a11y`**（公式 WebFetch）
7. ARCHIVE（Dash DESIGN）を正にしない
8. 振る舞い変更を伴うなら `tdd-workflow`

## 実行手順

1. 意図をユーザーに短く確認
2. 比較が必要なら `design-lab` を完了し **人の本決定を待つ**
3. 画面単位の採用は **`design-adoption`**
4. 採用案だけ `docs/design`（手）とコードを更新
5. hex 直書きを避け、セマンティック変数経由にする（テーマはトークン一式）
6. テーマ色プリセットを減らす「整理」を勝手にしない
7. `python scripts/check_design_compliance.py`（web を触ったとき）

## 完了後チェック

- [ ] `docs/design` と実装が矛盾していない
- [ ] カラータグ仕様を変えていない（別用途）
- [ ] 画面に `#RRGGBB` 直書きを増やしていない
- [ ] 3案が必要な変更なら Lab 比較＋人の本決定済み
- [ ] アイコン変更時は `icons.json` 更新 + `python scripts/sync_design_icons.py`
- [ ] アイコンは `@/lib/icons` から import
- [ ] `check_design_compliance` OK
- [ ] `post-change-verify`（web を触ったとき）
- [ ] 秘密・絶対パスを出していない

## まだ後回し（勝手に完成させない）

- `#9f606c` の 50〜950 スケール全文
- Lab なしでの本番リデザイン一括採用

## 関連

- 要望・pending: skill **`design-feedback`**
- 比較・スコア: skill **`design-lab`**
- 画面単位採用: skill **`design-adoption`**
- a11y: skill **`design-a11y`**
- 製品要否は `product-spec-sync`
- DB / カラータグ枠は `db-schema-change`（要承認）
