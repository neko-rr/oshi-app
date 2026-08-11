# 認証方針（Supabase Auth + Next.js + FastAPI）

Apply Mode: Always Apply

# このファイルは Cursor への指示用です。認証の**現在の正本**。

## 一言

**認証の発行体は todo-app と同じ Supabase Auth（既存プロジェクト継続）。**  
Web は **`@supabase/ssr` + Cookie + middleware**。API は **Bearer JWT**。  
Dash 用 **Flask PKCE + サーバ Cookie 入口保護は実装しない**。

旧手順の記録: [docs/archive/oauth-dash-flask.md](../../docs/archive/oauth-dash-flask.md)（**DEPRECATED・参照のみ**）

## 役割分担

| コンポーネント | やること | やらないこと |
|----------------|----------|--------------|
| Supabase Auth | サインアップ/イン、OAuth、JWT 発行 | 業務ロジック |
| Next.js | Cookie セッション、middleware refresh、ログイン UI | 自前で JWT を署名しない |
| FastAPI | Bearer 検証、`members_id` 注入、認可後の処理 | ログイン画面・パスワード保存 |
| Postgres RLS | 行の最終防衛（`auth.uid() = members_id`） | — |

## Web（todo-app 準拠）

1. `@supabase/ssr` の `createBrowserClient` / `createServerClient`
2. `middleware` でセッション確認（`getClaims()` 等）。未ログインは `/auth/login` へ
3. 環境変数（Web 公開）:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
4. 公式: [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## API（FastAPI）

1. 保護エンドポイントは `Authorization: Bearer <access_token>` 必須
2. トークンを検証し、クレーム `sub` を **`members_id`** として扱う
3. `Depends(get_current_user)` などに集約する
4. 401: 未認証・トークン不正 / 403: 認証済みだが権限なし
5. DB をユーザー資格で触るときは同じ JWT を付けたクライアントを使い **RLS を生かす**
6. `service_role` はバッチ・管理用途のみ（通常 API では使わない）

## プロバイダ設定（Supabase / Google — 旧 OAuth.md から存続）

### Supabase プロジェクト

1. 既存プロジェクトを継続（Project URL / publishable key）
2. **secret / service_role はサーバー専用**。Git・`NEXT_PUBLIC_*` に載せない（[security.md](security.md)）

### Google OAuth を使う場合

1. Supabase: **Authentication → Providers → Google** を ON
2. Google Cloud Console の OAuth クライアントで、**承認済みのリダイレクト URI** に **Supabase 標準のみ**:
   ```text
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
3. Supabase の Google 設定に Client ID / Client Secret を保存（**リポジトリに書かない**）
4. 自前で Google OAuth プロトコルや Flask PKCE 交換を実装しない

### URL Configuration（v2）

Supabase **Authentication → URL Configuration**

| 項目 | 方針 |
|------|------|
| Site URL | 本番の **Next.js** オリジン（仮置き時はローカル可） |
| Redirect URLs | Next のコールバックを完全一致で登録 |

例（ローカル）:

- `http://127.0.0.1:3000/auth/confirm`
- `http://127.0.0.1:3000/**`（ポリシーに応じて）

例（本番）:

- `https://<your-web-host>/auth/confirm`
- 必要なら sign-up / update-password 系のパス

**使わない（Dash 期）**: `http://127.0.0.1:8050/auth/callback` を **新規実装の正**にしない。  
残っていても害は少ないが、ドキュメントと実装は Next パスのみにする。

ローカルでは `localhost` と `127.0.0.1` を混在させない（どちらかに統一）。

## メール / パスワード

- todo-app と同様に UI を用意してよい
- メール確認は Supabase の設定に従う（confirm ルートは Next 側）

## モバイル（後から）

- 同一 Supabase プロジェクト
- セッションは SecureStore 等
- API は Web と同じ Bearer
- Cookie middleware は使わない

## セキュリティ

- トークン・Cookie・service role・JWT secret をログやチャットに出さない
- CORS は許可オリジンを明示（`*` + 認証付きは避ける）
- 本番の Cookie / HTTPS はホスティング設定に従う

## 旧方式との対応表

| Dash 期（アーカイブ） | v2（このファイル） |
|------------------------|---------------------|
| Flask `/auth/callback` PKCE | Next `/auth/confirm` + Supabase SSR |
| HttpOnly Cookie で Dash 入口保護 | Next middleware + 保護 Route |
| Cookie から Flask がユーザ判定 | FastAPI が Bearer JWT を検証 |
| `PUBLIC_SUPABASE_*` + `APP_BASE_URL` | `NEXT_PUBLIC_SUPABASE_*` + Site/Redirect URLs |
| Render 単体で UI+Auth | Web と API を分離（API は Render 等） |

## 参照

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [todo-app 構成](https://github.com/neko-rr/todo-app)（UI / `@supabase/ssr` の参考）
- API 契約: [docs/migration/v2/rules/api_contract.md](../../docs/migration/v2/rules/api_contract.md)
