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

## 書き出し成果物（exports）

| 項目 | 値 |
|------|-----|
| バケット | `exports`（Private） |
| オブジェクト path | `{members_id}/{data_export_id}.zip` |
| 用途 | 設定のデータ書き出し（TTL 後は失効。API がストリーム） |
| 注意 | アーカイブに **signed URL を入れない**（path／バイトのみ） |

表: `public.data_export`（ジョブ状態）。RLS は `members_id = auth.uid()`。

## 作成時

1. `photo` 行を insert（`members_id` = JWT sub）
2. Storage に path へ upload（ユーザー JWT + RLS）
3. path を DB に書く

## 削除時（推奨順）

1. 参照している `registered_product.photo_id` を NULL または付け替え
2. Storage オブジェクト削除
3. `photo` 行削除  

（現状 API の削除フローに合わせて実装すること。孤児ファイルを残さない）

## 退会時（account_delete）

Auth ユーザー削除では **Storage オブジェクトは自動では消えない**。  
API は次の順で処理する（`apps/api/app/services/account_delete_service.py`）:

1. Admin（`SUPABASE_SECRET_KEY`）で `photos/{members_id}/` と `exports/{members_id}/` を削除
2. Auth Admin `delete_user(members_id)` → 業務表は `ON DELETE CASCADE`

## Anonymous（ゲスト）

- JWT `is_anonymous=true` のユーザーは Storage／業務表への CRUD を **RLS RESTRICTIVE** で拒否する（`jwt_is_permanent_user()`）
- 本登録（メール紐づけ）後に同じ `members_id` で書き込み可能になる
- 詳細: `docs/product/flows/guest.md`

## セキュリティ

- バケットを Public にしない
- path に他人の `members_id` を入れない
- signed URL 全文をログ・Git に残さない（`security.mdc`）

## 関連

- [security.md](security.md)
- [schema-catalog.md](schema-catalog.md)
