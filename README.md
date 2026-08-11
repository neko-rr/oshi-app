# oshi-app v2（Next.js + FastAPI monorepo）

推し活グッズ管理アプリの新スタック。サービス未接続でもローカルで骨格を確認できる。

## 構成

```text
apps/web      Next.js（Auth UI + 画面）
apps/api      FastAPI（JWT 検証 + 業務 API）
apps/mobile   Expo（枠のみ）
packages/shared  共有型・API パス
```

## 前提

- Node.js 24+ / pnpm 10+
- Python 3.11+
- Cursor プロファイル: **Web-Oshi**（`.vscode/profiles/Web-Oshi.code-profile`）

## セットアップ

```powershell
# 依存
pnpm install
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..\..
```

環境変数（値は Git に入れない）:

- コピー: `apps/web/.env.example` → `apps/web/.env.local`
- コピー: `apps/api/.env.example` → `apps/api/.env`
- Supabase / Render の実値は起きてからの設定でよい

## 起動

```powershell
# ターミナル1: API
pnpm dev:api
# ターミナル2: Web
pnpm dev:web
```

- Web: http://127.0.0.1:3000
- API health: http://127.0.0.1:8000/health

## テスト

```powershell
# API（ルートから）
$env:PYTHONPATH = "apps/api"
python -m pytest apps/api/tests tests -q
```

## 認証方針

- Web: `@supabase/ssr` + Cookie（todo-app 準拠）
- API: `Authorization: Bearer <access_token>`
- 詳細: `.cursor/rules/auth.md`

## 起きてから必要なクラウド作業

1. Supabase Redirect URLs に Next origin /auth/confirm を追加
2. Render に FastAPI（`apps/api`）をデプロイし環境変数設定
3. `NEXT_PUBLIC_*` / `SUPABASE_JWT_SECRET` 等を設定
4. Google OAuth を使う場合は Provider ON（auth.md）

## エージェント向け

入口は [AGENTS.md](AGENTS.md)。命名・TDD・セキュリティは `.cursor/rules/`。
