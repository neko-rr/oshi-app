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
- **認証の正本**: `.cursor/rules/auth.md`（= `docs/migration/v2/rules/auth.md` と同系）
- **旧 OAuth（Flask+Dash）**: `docs/archive/oauth-dash-flask.md`（DEPRECATED）。`.cursor/rules/OAuth.md` は削除済み
- 現行 Dash 用 `file_structure.md` / `spec.md` / `database_configuration.md` は当面維持。v2 では配置 rule を差し替え

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

## 2026-08-12: OAuth.md の棚卸し（仕様移行）

- **正本**: `.cursor/rules/auth.md`（Next + FastAPI + Supabase Auth）
- **アーカイブ**: `docs/archive/oauth-dash-flask.md`（旧 Flask PKCE。冒頭 DEPRECATED）
- **削除**: `.cursor/rules/OAuth.md`（rules に旧仕様を残さない）
- Google Provider / Supabase callback URI など共通知識は新 `auth.md` に取り込み
- **skills への降格はしない**（仕様≠手順）

## 2026-08-12: 命名規則ハーネス

| 層 | パス | 役割 |
|----|------|------|
| rule | `.cursor/rules/naming.md` | 字形・置き場・禁止・JSON snake_case |
| 用語集 | `docs/migration/v2/glossary.md` | 旧なりゆき → 正（product/photo 等） |
| skill | `.cursor/skills/new-file-naming/` | 新規作成時チェックリスト |
| CLI | `scripts/naming_check.py` | 禁止名を pre-commit でも検査 |
| 入口 | `docs/migration/v2/AGENTS.md` + `.cursor/rules/architecture.md` | 旧 rules との優先順位 |

方針: **新規コードは 100% 遵守**。旧 Dash / 既存 DB 物理名は一括リネームしない。  
（`file_structure.md` は修正禁止の Dash 正本のため触らず、`architecture.md` で v2 優先を宣言。）

## 2026-08-12: TDD + Web プロファイル

### TDD

- rule: `.cursor/rules/tdd.md`
- skill: `.cursor/skills/tdd-workflow/`
- `pytest.ini` + `tests/test_tdd_harness.py`
- `.vscode/settings.json` / `launch.json` で pytest を有効化

## 2026-08-12 夜間: monorepo 骨格実装

### 完了

- pnpm monorepo: `apps/web`, `apps/api`, `apps/mobile`, `packages/shared`
- FastAPI: `/health`, `/me`（Bearer）, `/products` プレースホルダ + pytest
- Next.js: 認証ルート、`/me` 縦スライス、@supabase/ssr
- AGENTS.md / README / .env.example
- TDD tests green（API）

### 起きてからユーザー作業

1. Supabase Dashboard: Redirect URLs（Next `/auth/confirm`）
2. `apps/web/.env.local` と `apps/api/.env` に実キー（Git 不可）
3. Render に `apps/api` Dockerfile デプロイ
4. Google OAuth が必要なら Provider 設定（auth.md）

### ローカル確認

```powershell
pnpm dev:api
pnpm dev:web
curl http://127.0.0.1:8000/health
```
