# Cursor 開発メモ（重要連絡）

## 2026-08-12: Next.js + FastAPI 移行 Phase 0（A）

### 方針確定

- **新規 monorepo** で Next + FastAPI に移行する（サービス未開始のため既存 Supabase / 現行インフラ方針は継続利用）。
- **認証の発行体は todo-app と同じ Supabase Auth**。
- **Web**: `@supabase/ssr` + Cookie + middleware（todo-app 準拠）。
- **API**: FastAPI は **Bearer JWT**。Dash 期の Flask PKCE + 入口 Cookie ガードは**採用しない**。
- **RLS / `members_id`** は従来どおり最終防衛。
- モバイル（Expo）は後期。同じ Auth + 同じ API を前提に `apps/mobile` 枠のみ。

### 文書の置き場

- 計画: `.cursor/plans/next-fastapi-phase0-monorepo.md`
- 新リポ用ドラフト: `docs/migration/v2/`（AGENTS / rules / skill）
- 現行 Dash 用 `.cursor/rules/*`（修正禁止の記述あり）は当面維持。v2 ではドラフトをコピーして差し替え。

### 次アクション（要承認: Phase 1）

- 新規 GitHub リポジトリ作成 or ローカル monorepo 初期化
- `apps/web` + `apps/api` 骨格と `/health`・`/me` 縦スライス
- `docs/migration/v2/*` を新リポの `AGENTS.md` / `.cursor/*` へ配置

## 2026-08-12: 秘密情報ハーネス（private Git 用）

### 入れたもの

| 層 | パス |
|----|------|
| ignore | `.gitignore`（`.env` / 鍵 / credentials 等）、`.cursorignore` |
| rule | `.cursor/rules/security.md` |
| 共有検査 | `scripts/secret_guard.py` |
| Git hook | `.githooks/pre-commit` + `core.hooksPath=.githooks`（ローカル） |
| Cursor hooks | `.cursor/hooks.json`（危険な `git add .env` / `.env` 書き込み / `--no-verify` を deny） |

### 運用

- **実 `.env` はコミットしない**（gitignore 済み。`git add .env` は ignore）。
- private GitHub も **実キーは載せず**、Render/Supabase ダッシュボードにのみ置く。
- 初回クローン後: `git config core.hooksPath .githooks`
- Cursor の Hooks が効かない場合は Settings → Hooks を確認し、必要ならウィンドウ再読み込み。

### 未実施

- リモート（GitHub private）の作成・push はユーザー承認後。
- 初期コミットは、stage 内容を確認してから（`.env` が含まれないこと）。
