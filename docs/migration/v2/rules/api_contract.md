# API 契約（FastAPI）

Apply Mode: Always Apply（新リポジトリで使用）

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

## 初期エンドポイント（Phase 1）

| Method | Path | 認証 | 説明 |
|--------|------|------|------|
| GET | `/health` | 不要 | `{ "status": "ok" }` |
| GET | `/me` | 必須 | `{ "members_id": "<uuid>", "email": "..." }` |

## 命名

- パス: **複数形**のリソース名（例: `/products`）。`getXxx` 風は使わない
- JSON フィールド: **snake_case**（`members_id`）。詳細は naming.md
- `members_id` をクエリで「なりすまし可能」に渡さない。常にトークン由来
- クライアント固有フィールドは付けない。必要なら `X-Client: web|mobile` は任意（認可には使わない）
