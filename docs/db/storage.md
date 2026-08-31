<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# Storage（photos）運用メモ

DB の `photo` 行と、Supabase Storage のオブジェクトはセットで扱う。

## 規約

| 項目 | 値 |
|------|-----|
| バケット | `photos` |
| 公開 | **Private** |
| オブジェクト path | `{members_id}/{uuid}.jpg` |
| DB 列 | `photo_thumbnail_url` / `photo_high_resolution_url` に **path を保存**（公開 URL ではない） |
| 画面表示 | API が **signed URL** を発行（期限付き） |

実装の目安: `apps/api/app/infra/photo_storage.py` / `photo_signing.py`

## 作成時

1. `photo` 行を insert（`members_id` = JWT sub）
2. Storage に path へ upload（ユーザー JWT + RLS）
3. path を DB に書く

## 削除時（推奨順）

1. 参照している `registered_product.photo_id` を NULL または付け替え
2. Storage オブジェクト削除
3. `photo` 行削除  

（現状 API の削除フローに合わせて実装すること。孤児ファイルを残さない）

## セキュリティ

- バケットを Public にしない
- path に他人の `members_id` を入れない
- signed URL 全文をログ・Git に残さない（`security.mdc`）

## 関連

- [security.md](security.md)
- [schema-catalog.md](schema-catalog.md)
