# 起きてからの ToDo（クラウド / 秘密）

AI がローカルに置けない・あなた自身の操作が必要なもの。

## 1. 環境変数（Git に入れない）

| ファイル | 内容 |
|----------|------|
| `apps/web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `NEXT_PUBLIC_API_BASE_URL` |
| `apps/api/.env` | `SUPABASE_URL`, `SUPABASE_JWT_SECRET`（or JWKS 用 URL のみ）, `CORS_ORIGINS` |

例は `apps/web/.env.example` / `apps/api/.env.example`。

## 2. Supabase Dashboard

- Authentication → URL Configuration
  - Site URL: ローカルなら `http://127.0.0.1:3000`
  - Redirect: `http://127.0.0.1:3000/auth/confirm` など
- （任意）Google Provider ON

## 3. Render

- Web Service: `apps/api` の Dockerfile
- 上記 API 環境変数を設定
- ヘルスチェック: `/health`

## 4. ローカル起動確認

```powershell
pnpm dev:api
pnpm dev:web
# http://127.0.0.1:8000/health
# http://127.0.0.1:3000
```

## 5. 次の開発テーマ（優先候補）

1. products 一覧を RLS 付きで DB 接続
2. 登録フロー (register) の移植
3. ギャラリー画像 signed URL
4. private GitHub push
