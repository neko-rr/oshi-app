# 認証方針（Supabase Auth + Next + FastAPI）

Apply Mode: Always Apply（新リポジトリで使用）

## 一言

**認証の発行体は todo-app と同じ Supabase Auth。**  
Web の持ち方は todo-app（`@supabase/ssr`）。API は **Bearer JWT**。  
Dash 用 **Flask PKCE + サーバ Cookie 入口保護は使わない**。

## 役割分担

| コンポーネント | やること | やらないこと |
|----------------|----------|--------------|
| Supabase Auth | サインアップ/イン、OAuth、JWT 発行 | 業務ロジック |
| Next.js | Cookie セッション、middleware refresh、ログイン UI | 自前で JWT を署名しない |
| FastAPI | Bearer 検証、`members_id` 注入、認可後の処理 | ログイン画面・パスワード保存 |
| Postgres RLS | 行の最終防衛（`auth.uid() = members_id`） | — |

## Web（todo-app 準拠）

1. `@supabase/ssr` の `createBrowserClient` / `createServerClient`
2. `middleware` で `getClaims()`（または同等のセッション確認）し未ログインを `/auth/login` へ
3. 環境変数:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
4. 公式クイックスタートと todo-app の `src/lib/*` を正とする  
   参考: [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## API（FastAPI）

1. 保護エンドポイントは `Authorization: Bearer <access_token>` 必須
2. トークンを検証し、クレーム `sub` を **`members_id`** として扱う
3. `Depends(get_current_user)` のような一か所に集約する
4. 401: 未認証 / トークン不正。403: 認証済みだが権限なし
5. Supabase にユーザー資格で触る場合は、同じ JWT を付けたクライアントを使う（RLS を生かす）

## プロバイダ

- **メール/パスワード**: todo-app と同様に UI を用意してよい
- **Google OAuth**: oshi 既存方針。Supabase Provider + redirect URL を Next オリジンに合わせる
- 自前の Google OAuth プロトコル実装はしない

## モバイル（後から）

- 同じ Supabase プロジェクト
- セッションは SecureStore 等に保存
- API 呼び出しは Web と同じ Bearer
- Cookie middleware は使わない

## セキュリティ

- access / refresh トークン、service role、JWT secret をログや Issue に貼らない
- CORS は許可オリジンを明示（`*` + 認証付きは避ける）
- ローカル: Cookie Secure=false 可。本番 Secure=true（Next/ホスティング側設定に従う）

## 旧方式との対応表

| Dash 期 | v2 |
|---------|-----|
| Flask `/auth/callback` PKCE 交換 | Next `/auth/confirm` + Supabase SSR |
| HttpOnly Cookie で Dash 入口保護 | Next middleware + 保護 Route |
| Cookie から Flask がユーザ判定 | FastAPI は Bearer の JWT を検証 |
| `APP_BASE_URL` Flask | Next の Site URL / Redirect URLs |
