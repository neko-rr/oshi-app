<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# 登録フィールド辞書（Core / Oshi / External / Hidden）

`registered_product` の暫定48列と外部参照を、UI・APIの正として整理する。  
物理DROPはしない。見た目系は Vision 提案（カテゴリ／色／メモ）に寄せ、列増殖しない。

関連: [flows/register.md](flows/register.md) / [docs/db/generated/schema_guide.md](../db/generated/schema_guide.md)

## 優先順位（入力ソース）

**手入力（user） > バーコード／楽天照合（barcode） > Vision（vision） > 空**  
数量・交換OKの自動付与は **設定ON時の初回のみ**（手入力後は上書きしない）。楽天／Vision は数量フラグを触らない。

## Core（現行UIで扱う）

| 論理 | 物理／置き場 | 備考 |
|------|--------------|------|
| 製品名 | `product_name` | 必須 |
| 正面写真 | `photo_id` | 任意 |
| バーコード | `barcode_number` / `barcode_type` | 任意。ダブり判定キーの一方 |
| 購入価格・通貨 | `purchase_price` / `currency_code` | 価格なしなら通貨も保存しない |
| 購入場所 | `purchase_location` | 楽天 `shop_name` で空欄時のみ推奨 |
| 購入日 | `purchase_date` | 登録・詳細で編集可 |
| メモ | `memo` | Vision 見た目タグの追記先 |
| カテゴリ | `category_tag_id` | Vision `product_type` または楽天 genre 名マッチ |
| 収納 | `storage_location_id` | |
| 色 | `registered_product_color_tag` | Vision `colors` → スロット |

## Oshi identity（推し活）

| 論理 | 物理 | UI |
|------|------|-----|
| キャラクター名 | `character_name` | 登録・詳細で編集可 |
| 製品グループ名 | `product_group_name` | 同上 |
| 作品シリーズ名・タイトル | `works_series_name` / `title` | 登録・詳細で編集可 |
| 定価 | `list_price` | **当面UI非表示**（支出と同時検討） |

## ダブり土台（`duplicate_exchange` partial）

| 論理 | 物理 | 備考 |
|------|------|------|
| 所持数 | `registration_quantity` | UI 未入力時は 1 扱い |
| 交換OK | `sales_desired_flag` + `sales_desired_quantity` | 個数入力可 |
| 欲しい | `want_object_flag` | フラグのみ（専用数量列は無し） |

**同じグッズ判定キー:** バーコード **または** 楽天 `product_external_ref.external_item_code`（どちらか一致でグループ化）。CLIP／画像類似は将来。

**設定（`display_settings`）:**

- `keep_at_hand_count`（手元に残したい数。既定 1、1〜99）
- `auto_sales_desired`（ON かつ所持数 > 手元数のとき、交換OKを自動ONし余剰を `sales_desired_quantity` に入れる）

手調整: ユーザーが交換OK欄を一度保存したら、以降その製品は自動上書きしない（専用 bool 列は増やさない。初回／未設定からの適用のみ）。

一覧の交換OKフィルタ・交換／メルカリ専用画面は未実装。

## External（外部マーケット参照）

表: `product_external_ref`（製品あたり `source` 一意）

| source | 必須列 | 用途 |
|--------|--------|------|
| `rakuten` | `product_url`（アフィ優先） / `external_item_code` / `shop_name` | 照合で候補を選んだとき。再購入リンク・ダブりキー |
| `manual` | `product_url`（`label` 任意） | メルカリ等の任意URL |
| `amazon` | （将来） | 未実装 |

## Vision担当（DB列を増やさない）

| Vision | 反映先 |
|--------|--------|
| `product_type` | `category_tag` 名マッチ → `category_tag_id` |
| `colors[]` | カラースロット |
| `visual_tags[]` | チップ → ユーザー操作で `memo` |
| `description` | 空なら `memo` 種 |

## Hidden-legacy（UI非表示・APIも書かない）

旧FKスカラー（`works_series_id` 等）、`color_tag_id`（ジャンクションへ移行済）、`storage_location_tag_id`、`currency_unit_id`、`campaign_id`、サイズ3列、列 `product_type`、`copyright_*`、`freebie_*`、`other_tag`、シリーズ数量・コンプリート等の未配線フラグ。

## システム

`members_id` / `creation_date` / `updated_date` — 現行どおり。
