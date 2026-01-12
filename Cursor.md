# 開発者向けメモ（最新仕様・起動必須）

## 概要

- Dash Pages を使用し、`_pages_location.pathname` を更新してページ遷移する構成。`app.py` で `.env` を最初に読み込み、`create_app()` が `app` / `server` を生成（Gunicorn は `app:server` を起動）。
- Supabase 未設定でも UI は起動するが、保存・ギャラリー・テーマ永続化は無効。

## 起動手順（PowerShell / ローカル開発・認証動作確認）

- 事前準備（初回/再セットアップ時）:
  ```powershell
  cd C:\Users\ryone\Desktop\oshi-app
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  ```
- `.env` に **PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY / APP_BASE_URL / SECRET_KEY / COOKIE_SECURE / COOKIE_SAMESITE** を設定（フォールバック無し、`SUPABASE_ANON_KEY` は使用しない）。
- 通常起動（Flask+Dash 入口は `server.py`）:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  python server.py
  ```
- ログ付き強制起動（同じく `server.py` を実行）:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  powershell -ExecutionPolicy Bypass -File .\start_with_logs.ps1
  ```
  - ログ確認: `Get-Content app_run.log -Tail 50`
- ブラウザ: **必ず `http://127.0.0.1:8050` に統一**（`localhost` と混在させない）。
  - 以後、リンクを踏む/ブックマークも含めて **127.0.0.1 側だけ** を使ってください。
  - 既にループしている場合は、`127.0.0.1` と `localhost` の両方の Cookie を削除してから再アクセスしてください。
- 認証確認フロー: `http://127.0.0.1:8050/login` を開く → ボタンで Google ログイン → `/auth/callback?code=...&app_state=...` に戻り、Cookie がセットされトップへ遷移することを確認。
  - app_state / PKCE / redirect_to は当ドメインの Cookie に保存し、/auth/callback で照合 → 交換 → 即削除。Supabase 側の state には依存しない。
  - `bad_oauth_state` が出る場合は、Supabase が state 検証に失敗して Site URL にエラーを返した可能性があるため、app_state 方式にそろえた上で単一タブで再試行する。
  - 調査時は `AUTH_DEBUG=1` を設定し、ログの `AUTHDBG login_* / callback_* / require_auth_* / verify_token_*` で進捗と失敗箇所を確認（値はマスク済み）。出ない場合は PowerShell で `$env:AUTH_DEBUG=1` を設定してから `python server.py` を実行。
  - メール/パスワード認証:
    - サインイン: `/auth/email/signin` に email/password を POST（ログイン画面のフォームで実行）。成功すると HttpOnly Cookie にセッションが入る。
    - サインアップ: `/auth/email/signup` に email/password を POST。メール確認が完了するまでセッションは発行されない。確認後にサインインを実施。
    - パスワードリセット: `/auth/email/reset` に email を POST。受信メールのリンクから再設定。
- 停止: `Ctrl+C` または `Stop-Process -Name python -ErrorAction SilentlyContinue`

## 環境変数

- ローカルは `.env`（例: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `SUPABASE_SECRET_DEFAULT_KEY`, `DATABASE_URL`, `RAKUTEN_APPLICATION_ID`, `IO_INTELLIGENCE_API_KEY` など）。
- 環境変数は `PUBLIC_SUPABASE_URL` と `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` を必須とし、フォールバックはありません（起動は `python server.py`）。
- デバッグ用: `AUTH_DEBUG=1` で認証フローのマスク済み print ログを出力（state/token は末尾のみ表示）。本番ではオフ推奨。
- `.dockerignore` により `.env` はイメージに入らない。Render では Environment Variables で同名を必ず設定。

## 登録 3 ステップ仕様（正しい挙動）

- URL: `/register/barcode` → `/register/photo` → `/register/review`。`/register` 直叩きは `/register/barcode` へリダイレクト。
- 自動遷移の責務: 各ステップのコールバックが成功/スキップ時に `_pages_location.pathname` を更新して次ページへ進める。
  - バーコード: `status in {captured, manual, skipped}` → `/register/photo`
  - 正面写真: `status in {captured, skipped}` → `/register/review`
- 楽天 API 結果やタグはレビュー画面で表示。
- 注意: 「ナビから登録開始したら常に新規開始」のため、`/register/barcode` に外部から入った場合は `registration-store` を初期化する。

## Supabase 接続確認（ローカル）

- コマンド:
  - `python .\scripts\check_supabase.py`
  - `python .\scripts\check_supabase.py --json`（JSON 出力）
  - `python .\scripts\check_supabase.py --write`（安全な書き込みテスト）
- 判定の目安:
  - `db.*.ok=False` かつ `permission denied` → RLS/ポリシーの可能性大
  - `db.*.ok=True` で `rows=0` → 権限は通るがデータ無し
  - `storage.photos_list.ok=False` → Storage ポリシー/バケット/キーを確認

## Render / Docker

- `Dockerfile`: python:3.11-slim, `libzbar0` 必要、`gunicorn server:app`、`PORT` デフォルト 8050、`EXPOSE 8050`、ヘルスチェック有り。
- Render (docker_web_service) では ENV に `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `SUPABASE_SECRET_DEFAULT_KEY`, `APP_BASE_URL`, `SECRET_KEY`, `RAKUTEN_APP_ID`, `IO_INTELLIGENCE_API_KEY` 等を設定すること。
- `.dockerignore` で `.env`, ログ, DB, tests などを除外済み。

## よくある不具合と確認ポイント

- 画面が出ない/真っ白: ブラウザコンソールの赤エラーと `/_dash-update-component` を確認。DuplicateCallback エラー時は `allow_duplicate=True` を付ける。
- エラー共有方法：Console で Duplicate callback outputs をテキスト検索
- 自動遷移しない: `registration-store` の status 更新と `_pages_location.pathname` が更新されているかを確認。
- Supabase 取得失敗: Network タブで `supabase.co` のレスポンスを確認。`permission denied` は RLS、`0 rows` はデータ不足。
- カメラ不具合: `assets/camera.js` がロードされているか、ブラウザのカメラ許可を確認。

## ディレクトリ案内

- `app.py`: エントリ。Dash Pages、`_pages_location` 遷移、`.env` 早期読込。
- `pages/`: Dash Pages の各ページ（`register/` 配下に登録フロー、settings/home/gallery 等）。
- `features/`: 各機能のコールバックロジック（barcode/photo/review）。
- `components/`: 共通 UI・ナビ・テーマ周り。
- `services/`: Supabase や外部 API（barcode_lookup, photo_service, theme_service 等）。
- `assets/`: `styles.css`, `camera.js`（自動ロード）。
- `scripts/check_supabase.py`: 接続/権限ヘルスチェック。
