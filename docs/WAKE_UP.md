<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# 起きてからの ToDo（クラウド / 秘密）

AI がローカルに置けない・**人間が Dashboard でやる作業**。  
日々の開発入口は [README.md](../README.md) / [AGENTS.md](../AGENTS.md)。  
**製品:** Oshihaven（公式 https://oshihaven.com）。  
公開するまで `apps/web/src/lib/brand.ts` の `SITE_INDEXABLE` は **false**（検索に出さない）。

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

## 3. 依存の更新（Renovate）

設定: リポジトリ直下の `renovate.json`。公開から **3日未満** の版は PR にしない。自動マージはしない。週次（月曜朝・日本時間）。対象は pnpm / Python requirements / GitHub Actions / API の Dockerfile。

pnpm も同じ待ち時間（`pnpm-workspace.yaml` の `minimumReleaseAge`）。

- [ ] [Renovate GitHub App](https://github.com/apps/renovate) を **このリポジトリだけ** にインストールし、出る「Configure Renovate」PR をマージする
- [ ] GitHub の Dependabot **alerts（通知）** はオンでよい
- [ ] Dependabot の **version updates / security updates はオフ**（セキュリティ更新が待ち時間を飛ばすため。更新 PR は Renovate だけ）

## 4. デプロイ想定

- **API**: Render（Docker）— env は Dashboard のみ。ヘルス `/health`
- **Web**: Cloudflare **Workers** + OpenNext（静的 Pages ではない。`apps/web/wrangler.jsonc`）
- **キー一覧**: [deploy/env-contract.md](deploy/env-contract.md)

### Render（このリポジトリ）

プロトタイプの Flask 起動のままリポジトリだけ差し替えない。

| 項目 | 設定 |
|------|------|
| Source | **この** GitHub リポジトリ（プロトタイプではない） |
| Language | Docker |
| Dockerfile Path | `apps/api/Dockerfile` |
| Root Directory | **空**（ビルド文脈はリポジトリルート） |
| Docker Command | 空（イメージの CMD を使う） |
| Health Check Path | `/health` |

環境変数は [env-contract.md](deploy/env-contract.md) の Render 列。`CORS_ORIGINS` は本番 Web オリジンのみ。`SUPABASE_JWT_SECRET` は置かない。

### Cloudflare（このリポジトリ）

静的エクスポートや旧 next-on-pages は使わない。Next.js 16 App Router + Cookie セッション。

公式の vinext は 2026-10-05 時点で互換 **91%**。`next-intl` は部分対応（クライアントで intl context 欠落の既知問題）。本番の ja/en と Cookie セッションを守るため、当面の Workers 載せは **OpenNext**（`@opennextjs/cloudflare`）。vinext へは intl が安定してから。

| 項目 | 設定 |
|------|------|
| 製品 | **Workers**（Pages の静的サイトではない） |
| Source | **この** GitHub リポジトリ |
| Root Directory | **空**（pnpm workspace。`apps/web` だけ切ると `@oshi/shared` が壊れる） |
| Build | `pnpm install && pnpm build:shared && pnpm -C apps/web run cf:build` |
| Deploy | `pnpm -C apps/web exec wrangler deploy` |
| Worker 名 | `oshihaven`（`wrangler.jsonc` と一致） |
| カスタムドメイン | `oshihaven.com`（www は本番オリジンに寄せる） |
| 検索 | 公開まで `SITE_INDEXABLE=false` のまま（コード）。CF 側で index を強制しない |

環境変数は [env-contract.md](deploy/env-contract.md) の Cloudflare 列のみ。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_BASE_URL` = Render の **HTTPS**（末尾スラッシュなし）
- 任意: `NEXT_PUBLIC_BASE_URL=https://oshihaven.com`

`SUPABASE_SECRET_KEY` / JWT 秘密 / `AUTH_GATE_BYPASS` / E2E stub は置かない。

ドメインを Cloudflare に載せる（人が Dashboard でやる）:

1. Cloudflare にゾーン `oshihaven.com` を追加し、レジストラの NS を Cloudflare にする
2. Worker にカスタムドメイン `oshihaven.com` を付ける（Render には付けない）
3. Supabase Auth の Site URL / Redirect に `https://oshihaven.com` を追加
4. Render の `CORS_ORIGINS=https://oshihaven.com`

ローカルの OpenNext 変換は Windows 非保証。本番ビルドは Cloudflare CI（Linux）で行う。

## 5. ローカル起動

```powershell
# 先に apps/api/.venv を作成（README 参照）
pnpm dev:api
pnpm dev:web
```

## 6. 移管状況

コア（認証・製品・写真・タグ・統計・ダッシュボード・assist 設計）は移管済み。  
登録ウィザード（1→2→6）・検索・プライバシーページは Web で利用可。  
後回し: 書籍/SNS、規約、theme_settings 表、全削除、カメラ本格読取、Vision LIVE。  
楽天は仕様変更で再登録まで LIVE 停止前提（`RAKUTEN_LIVE_CALLS=0`）。IO は `IO_LIVE_CALLS=1` で実呼び出し。

エージェント規約: `AGENTS.md` + `.cursor/rules/*.mdc` + skill `official-docs-first`
