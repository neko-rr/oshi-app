<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# 起きてからの ToDo（クラウド / 秘密）

AI がローカルに置けない・**人間が Dashboard でやる作業**。  
日々の開発入口は [README.md](../README.md) / [AGENTS.md](../AGENTS.md)。

## 1. 環境変数（Git に入れない）

**正本（必須／任意／ホスト別）:** [deploy/env-contract.md](deploy/env-contract.md)

| ファイル | 内容（要約） |
|----------|------|
| `apps/web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_BASE_URL` |
| `apps/api/.env` | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,（任意）`SUPABASE_JWKS_URL`。`CORS_ORIGINS` 未設定なら localhost:3000 既定 |

**使わない**: `SUPABASE_JWT_SECRET`（API は JWKS のみ。設定しても無視）

例は `apps/web/.env.example` / `apps/api/.env.example`。**ルート `.env` は API から読まない。**

## 2. Supabase Dashboard

- **JWT Signing Keys**（非対称）を有効化 → JWKS の `keys` が空でないこと  
  `https://<project>.supabase.co/auth/v1/.well-known/jwks.json`
- Authentication → URL Configuration  
  - Site URL: ローカルなら `http://127.0.0.1:3000`  
  - Redirect: `http://127.0.0.1:3000/auth/confirm` など  
- （任意）Google Provider ON
- **公開前**: Auth の漏洩パスワード保護（Have I Been Pwned）  
  - **Pro プラン以上が必要**（2026-08 時点・無料では不可）  
  - 一般公開・有料プラン移行時に有効化を検討  
  - 詳細メモ: [docs/db/security.md](db/security.md)（Git に載せてよい運用メモ）

## 3. デプロイ想定

- **API**: Render（`apps/api`）— env は Dashboard のみ。ヘルス `/health`
- **Web**: Cloudflare Pages 等 — `.cursor/rules/deploy.mdc`
- **キー一覧**: [deploy/env-contract.md](deploy/env-contract.md)

## 4. ローカル起動

```powershell
# 先に apps/api/.venv を作成（README 参照）
pnpm dev:api
pnpm dev:web
```

## 5. 移管状況

コア（認証・製品・写真・タグ・統計・ダッシュボード・assist 設計）は移管済み。  
登録ウィザード（1→2→6）・検索・プライバシーページは Web で利用可。  
後回し: 書籍/SNS、規約、theme_settings 表、全削除、カメラ本格読取、Vision LIVE。  
楽天は仕様変更で再登録まで LIVE 停止前提（`RAKUTEN_LIVE_CALLS=0`）。IO は `IO_LIVE_CALLS=1` で実呼び出し。

エージェント規約: `AGENTS.md` + `.cursor/rules/*.mdc` + skill `official-docs-first`
