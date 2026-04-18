# Cursorから開発者へのメモ（最新仕様・起動必須）

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
- テスト（ルートで実行）: `python -m pytest tests/ -q`。手順の詳細は [.cursor/skills/post-change-verify/SKILL.md](.cursor/skills/post-change-verify/SKILL.md)。
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

  - ログ確認: `Get-Content logs/app_run.log -Tail 50`（登録デバッグは `logs/debug_log.txt` 等）

- ブラウザ: **必ず `http://127.0.0.1:8050` に統一**（`localhost` と混在させない）。
  - 以後、リンクを踏む/ブックマークも含めて **127.0.0.1 側だけ** を使ってください。
  - 既にループしている場合は、`127.0.0.1` と `localhost` の両方の Cookie を削除してから再アクセスしてください。
- **Cursor 内のシンプルブラウザ**（エディタ内で URL を開く。レイアウト確認向け）:
  1. コマンドパレットを開く（Windows/Linux: `Ctrl+Shift+P`、Mac: `Cmd+Shift+P`）。
  2. `Simple Browser: Show` と入力して実行（UI が日本語の場合は「シンプル ブラウザ」などで検索）。
  3. 表示された入力欄に `http://127.0.0.1:8050` を入れて Enter（先に `python server.py` 等でサーバーを起動しておく）。
  - Google OAuth や別タブへのリダイレクトは **外部ブラウザの方が確実**なため、ログイン動作確認は従来どおり Chrome 等を推奨する。
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
- `DASH_DEBUG=1`: レビュー画面・`photo_service` 等の開発用 `print` を有効化（未設定・0 のときは抑制）。
- `.dockerignore` により `.env` はイメージに入らない。Render では Environment Variables で同名を必ず設定。

## 表示速度・計測基準（改善フェーズ）

- **必須シナリオ**: 同一ユーザーで (1) `/` 初回表示、(2) `/gallery` 初回表示。
- **ブラウザ**: DevTools の Network で `/_dash-update-component` の件数・ペイロード、`supabase.co` / Storage の待ち時間。
- **合格基準の例**: ギャラリーで Storage 署名に相当する処理が「表示ページサイズ（既定 48 件）」に頭打ちになること。ホーム統計は `app_registration_product_stats` RPC（未マイグレーション時は head count フォールバック）で全行取得を避けること。
- **手順・棚卸し表**: [`docs/dash_callback_baseline.md`](docs/dash_callback_baseline.md)、[`docs/dash_initial_callbacks_inventory.md`](docs/dash_initial_callbacks_inventory.md)。

## PRレビュー観点（Step 1b: セキュリティゲート）

表示速度・コールバック統合・clientside 化は **攻撃面・データ漏えい・認可抜け** を増やしやすい。**次の観点を満たさない変更はマージしない**（例外はレビュー合意＋対策コメントを PR に残す）。詳細は初回コールバック整理プランの Step 1b に相当。

### 認可とデータ境界

- DB/Storage に触れる経路は、変更後も **`get_supabase_client()` 等で RLS が効くユーザークライアント**を崩さない。サービスロールは従来どおり限定用途のみ。
- URL クエリやクライアント Store 由来の ID（例: `registration_product_id`）で取得する場合、**他ユーザーの行が見えないこと**を手動で確認。エラー文言は **存在の推測や内部 ID の列挙**に繋がりすぎない表現にする。
- **`registration-store` に画像 base64 等が含まれる**前提で、ログ・トレース・デバッグ出力に **ストア全文・画像・署名 URL・トークン**を出していないか確認する。

### クライアント寄せ（リダイレクト・テーマ）

- リダイレクトや `href` 更新を clientside に寄せる場合、遷移先は **同一オリジン上の固定パス**に限定し、ユーザー入力からクエリを自由に組み立てない（オープンリダイレクト対策）。
- テーマ CSS の URL は **`BOOTSWATCH_THEMES` 相当の許可リスト**外を拒否するか、サーバー保存を正とする。`localStorage` 改ざんで **任意ドメインの CSS** が読み込まれないこと。

### 可用性・濫用

- 重い処理を1コールバックにまとめる場合、**単一リクエストの CPU/外部 API コスト**が許容か、既存のガード（例: タグ処理の loading ゲート）と矛盾しないかを確認する。

### 計測・共有

- PR やチケットに Network スクリーンショット・HAR を貼るとき、**Cookie・Authorization・署名付き URL** が写っていないか確認する。

### 本番相当のフラグ

- マージ前に **本番想定で `AUTH_DEBUG` / `DASH_DEBUG` がオフ**でも致命傷がないことを確認する（デバッグ依存の処理分岐を増やさない）。

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
- 収納場所プリセット削除の永続化: `supabase/migrations/20260419140000_receipt_location_preset_slot_dismissed.sql` を Supabase に適用すること。未適用だと削除記録が失敗し、次回アクセスで欠けたプリセット slot が再作成される場合がある。

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

## デザイン運用メモ（色付き主要カード）

- `DESIGN.md` v1.2 で「主要情報カードは色付きカード（`card-main-*`）を主軸」に変更。
- 主要クラス:
  - `card-main-primary`
  - `card-main-secondary`
  - `card-main-info`
  - `card-main-success`
  - `card-main-warning`
  - `card-main-danger`
- 例外として `card-custom` は、入力補助・長文・明細など可読性優先領域で使用可。
- 文字色は背景とセットで運用（背景だけ変更しない）。
- 画面崩れ防止:
  - グローバル要素（`body`, `button`, `.btn`）への広域適用は避ける
  - 変更時は `home/register/gallery/settings` を最低確認する

## ディレクトリ案内

- `app.py`: エントリ。Dash Pages、`_pages_location` 遷移、`.env` 早期読込。
- `pages/`: Dash Pages の各ページ（`register/` 配下に登録フロー、settings/home/gallery 等）。
- `features/`: 各機能のコールバックロジック（barcode/photo/review）。
- `components/`: 共通 UI・ナビ・テーマ周り。
- `services/`: Supabase や外部 API（barcode_lookup, photo_service, theme_service 等）。
- `assets/`: `styles.css`, `camera.js`（自動ロード）。
- `scripts/check_supabase.py`: 接続/権限ヘルスチェック。
