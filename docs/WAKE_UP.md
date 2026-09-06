<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# 起きてからの ToDo（クラウド / 秘密）

AI がローカルに置けない・**人間が Dashboard でやる作業**。  
日々の開発入口は [README.md](../README.md) / [AGENTS.md](../AGENTS.md)。

## 1. 環境変数（Git に入れない）

**正本（必須／任意／ホスト別）:** [deploy/env-contract.md](deploy/env-contract.md)

| ファイル | 内容（要約） |
|----------|------|
| `apps/web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_BASE_URL` |
| `apps/api/.env` | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, **`SUPABASE_SECRET_KEY`（退会 `DELETE /account` 用）**、（任意）`SUPABASE_JWKS_URL`。`CORS_ORIGINS` 未設定なら localhost:3000 既定 |

**使わない**: `SUPABASE_JWT_SECRET`（API は JWKS のみ。設定しても無視）

例は `apps/web/.env.example` / `apps/api/.env.example`。**ルート `.env` は API から読まない。**

### Render（API）チェック

- [ ] `SUPABASE_SECRET_KEY` を Dashboard に設定（値はチャット・Git に出さない）
- [ ] 退会は通常 CRUD では使わない（`supabase_admin` 経由のみ）

## 2. Supabase Dashboard

- **JWT Signing Keys**（非対称）を有効化 → JWKS の `keys` が空でないこと  
  `https://<project>.supabase.co/auth/v1/.well-known/jwks.json`
- Authentication → URL Configuration  
  - Site URL: ローカルなら `http://127.0.0.1:3000`  
  - Redirect: `http://127.0.0.1:3000/auth/confirm` など  
- **Anonymous Sign-Ins（ゲスト開始）を ON**  
  - Authentication → Providers → Anonymous（**2026-09-06 有効化済み**）  
  - **先に** RLS の `*_reject_anonymous` / `jwt_is_permanent_user()` がライブに入っていること（migration `20260906200000_reject_anonymous_rls`）  
  - 有効化後、ホームの「ゲストではじめる」が動く  
  - 一般公開時は CAPTCHA / Turnstile を検討（匿名ユーザー肥大防止）  
- （任意）Google Provider ON
- **公開前**: Auth の漏洩パスワード保護（Have I Been Pwned）  
  - **Pro プラン以上が必要**（2026-08 時点・無料では不可）  
  - 一般公開・有料プラン移行時に有効化を検討  
  - 詳細メモ: [docs/db/security.md](db/security.md)（Git に載せてよい運用メモ）

### 匿名ユーザー（ゲスト）掃除方針

ゲストは業務データをほぼ残さないが、試行のたび `auth.users` に行が増える。  
**今は自動バッチ不要。公開前は手動・月1。** 利用が増えたら cron に昇格。

| 項目 | 方針 |
|------|------|
| 対象 | `is_anonymous = true` かつ **作成から 30 日超** |
| 頻度（限定公開中） | **月1・手動**（SQL Editor で件数確認 → 削除） |
| 頻度（一般公開後） | 件数が増え始めたら **週1 or 月1 の cron** を検討 |
| 例外 | 本登録途中（メール確認待ち）を巻き込みにくいよう、30日未満は消さない |
| やらない | 7日など短すぎる期限／無確認の自動全削除 |

**手順（安全順）**

1. 件数だけ見る

```sql
select count(*)
from auth.users
where is_anonymous is true
  and created_at < now() - interval '30 days';
```

2. 問題なければ削除（CASCADE で業務表も消えるが、ゲストはほぼ空想定）

```sql
delete from auth.users
where is_anonymous is true
  and created_at < now() - interval '30 days';
```

関連フロー: [docs/product/flows/guest.md](product/flows/guest.md)

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
