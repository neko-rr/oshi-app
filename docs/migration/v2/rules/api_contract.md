<!-- 更新: ARCHIVE寄り — 移行メモ。現行正本はルート AGENTS.md と .cursor/rules/*.mdc。凡例: docs/README.md -->
# API 契約（FastAPI）

> **運用中の命令は `.cursor/rules/api_contract.mdc`。** このファイルは詳細メモ。Always Apply しない。

## 共通

- Base URL: 環境変数 `NEXT_PUBLIC_API_BASE_URL`（Web）/ サーバ側 CORS で許可
- 形式: JSON（`Content-Type: application/json`）
- 時刻: ISO 8601（UTC 推奨）。レスポンスでタイムゾーンを省略しない方針にする場合は統一

## 認証

- 保護 API: ヘッダ `Authorization: Bearer <supabase_access_token>`
- 公開 API: `/health` のみ（初期）

## エラーレスポンス形（推奨）

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ユーザー向けの短い説明",
    "details": null
  }
}
```

| HTTP | いつ |
|------|------|
| 400 | 入力不正（業務） |
| 401 | 未ログイン・トークン無効 |
| 403 | 権限なし |
| 404 | リソースなし |
| 409 | 競合 |
| 500 | システムエラー（内部詳細はログのみ） |

## エンドポイント（移管済み）

| Method | Path | 認証 | 説明 |
|--------|------|------|------|
| GET | `/health` | 不要 | `{ "status": "ok" }` |
| GET | `/me` | 必須 | `{ "members_id": "<uuid>", "email": "..." }` |
| GET | `/products` | 必須 | 一覧（signed サムネ含む） |
| POST | `/products` | 必須 | 製品登録 |
| GET | `/products/{id}` | 必須 | 詳細（高解像度 signed URL 可） |
| PATCH | `/products/{id}` | 必須 | 更新（タグ・スロット含む） |
| DELETE | `/products/{id}` | 必須 | 削除 |
| POST | `/photos` | 必須 | 正面写真アップロード |
| GET/PUT | `/color-tags` | 必須 | カラータグ 7 スロット |
| GET/POST/PATCH/DELETE | `/category-tags` | 必須 | カテゴリタグ |
| GET/POST/PATCH/DELETE | `/receipt-locations` | 必須 | 収納場所 |
| GET | `/stats/products` | 必須 | ホーム用集計 |
| GET | `/dashboard/charts` | 必須 | ダッシュボード系列 |
| POST | `/assist/*` | 必須 | Vision / tags / barcode（LIVE ゲート） |

`ProductListItem` に `photo_thumbnail_path`（Storage object path）と `photo_thumbnail_url`（署名 URL・失敗時 null）を含む。
アシストのソフトステータスは `docs/migration/v2/assist_external_apis.md` 参照。

## 命名

- パス: **複数形**のリソース名（例: `/products`）。`getXxx` 風は使わない
- JSON フィールド: **snake_case**（`members_id`）。詳細は naming.md
- `members_id` をクエリで「なりすまし可能」に渡さない。常にトークン由来
- クライアント固有フィールドは付けない。必要なら `X-Client: web|mobile` は任意（認可には使わない）
