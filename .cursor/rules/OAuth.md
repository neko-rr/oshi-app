# Google OAuth (Supabase) + Flask + Dash (Docker on Render)

サーバ側 PKCE コード交換＋ HttpOnly Cookie で Dash を入口保護する最小構成です。Docker で Render にデプロイできます。

## 前提条件

- Python 3.11 推奨（Docker は python:3.11-slim）
- Supabase アカウント（無料で作成可能）
- Render アカウント（無料で作成可能）
- Google Cloud Console アカウント（Google OAuth 設定用）

## セットアップ手順

### 1. Supabase の設定（必須）

1. [Supabase](https://supabase.com/) でプロジェクト作成
2. **Project URL** を取得（= `PUBLIC_SUPABASE_URL`）
3. **API Keys** から **Publishable key** を取得（= `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`）

> このリポジトリは **`PUBLIC_SUPABASE_URL` と `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` のみ**を参照します（フォールバック無し）。

### 2. Supabase で Google OAuth を有効化（必須）

1. Supabase ダッシュボードで **Authentication → Providers → Google** を ON
2. Google Cloud Console で OAuth クライアントを作成し、**承認済みのリダイレクト URI** に Supabase 標準を登録：
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
3. Supabase の Google 設定に **Client ID / Client Secret** を入力して保存

### 3. Supabase Auth の URL Configuration（重要）

Supabase ダッシュボードで **Authentication → URL Configuration** を設定します。

- **Site URL**: 本番の Render URL（例: `https://<your-render>.onrender.com`）
- **Redirect URLs**: ローカルと本番の両方を登録（完全一致）
  - `http://127.0.0.1:8050/auth/callback`
  - `https://<your-render>.onrender.com/auth/callback`

### 4. ローカル環境でのテスト（app_state + PKCE + HttpOnly Cookie）

1. 仮想環境と依存関係：
   ```bash
   python -m venv venv
   # Windows: venv\\Scripts\\activate
   # macOS/Linux: source venv/bin/activate
   pip install -r requirements.txt
   ```
2. `.env` を作成して設定（例）：
   ```bash
   PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
   PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb-publishable-..."
   APP_BASE_URL="http://127.0.0.1:8050"
   SECRET_KEY="ランダム文字列"
   COOKIE_SECURE="false"
   COOKIE_SAMESITE="Lax"
   AUTH_DEBUG="1"   # 必要な時だけ
   ```
3. 起動：
   ```bash
   python server.py
   ```
4. ブラウザで `http://127.0.0.1:8050/login` を開き、Google ログイン → `/` 表示を確認

> 実装の要点：
>
> - Supabase に `state` を渡さず、アプリ独自の `app_state` を `redirect_to` に埋め込み、Cookie とクエリで照合（CSRF 対策）
> - `code` をサーバ側で `/auth/v1/token?grant_type=pkce` に交換
> - セッションは HttpOnly Cookie（`sb-access-token` 等）に保存

### 5. Render へのデプロイ（Docker）

1. Render の Web Service を Docker で作成（ルートの `Dockerfile` を使用）
2. Render の Environment Variables を設定（Git に入れない）
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `APP_BASE_URL`（例: `https://<your-render>.onrender.com`）
   - `SECRET_KEY`
   - `COOKIE_SECURE=true`
   - `COOKIE_SAMESITE=Lax`
   - `AUTH_DEBUG=1`（必要時のみ）
3. デプロイ後 `https://<your-render>.onrender.com/login` でログインできることを確認

> `Dockerfile` は `gunicorn server:app` で起動し、ヘルスチェックは `/login` を使用します。

## トラブルシューティング（認証）

- ローカルで Google 認証がループする/動かない:
  - `APP_BASE_URL` とブラウザのアクセス URL を **`http://127.0.0.1:8050` に統一**（`localhost` と混在させない）
  - Supabase の Redirect URLs に `http://127.0.0.1:8050/auth/callback` が入っているか確認
- `AUTH_DEBUG=1` を設定すると `AUTHDBG` ログが出ます（トークン等はマスクされます）

## 参考リンク

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Error Codes](https://supabase.com/docs/guides/auth/debugging/error-codes)
- [Supabase Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=framework&framework=express)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Render Documentation](https://render.com/docs)
