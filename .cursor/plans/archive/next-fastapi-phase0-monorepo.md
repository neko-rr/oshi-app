---
name: Phase0 monorepo骨格（Next+FastAPI）
overview: 新規リポジトリ向け monorepo 構成・認証方針・最小 rules/skills を文書化する（実装コードはまだ作らない）。既存 Supabase / Render を継続利用。
todos:
  - id: auth-decision
    content: 認証を Supabase Auth（todo-app と同じ ID 基盤）＋ Next SSR Cookie ／ FastAPI Bearer JWT に確定
    status: completed
  - id: monorepo-layout
    content: monorepo 配置（apps/web, apps/api, packages/*）と環境変数一覧を文書化
    status: completed
  - id: min-rules-skills
    content: AGENTS / rules 3本 / skill 1本のドラフトを docs/migration/v2 に配置
    status: completed
  - id: seed-new-repo
    content: 承認後、新規 GitHub リポジトリへ骨格コードを生成（Phase 1）
    status: pending
isProject: false
---

# Phase 0: monorepo 骨格と最小仕組み（A）

## 前提（ユーザー確定事項）

- サービス未開始 → **既存 Supabase プロジェクトを継続**（DB / Auth / Storage / RLS）。
- デプロイ先も当面 **Render（API）** など既存方針を踏襲可能。Web は後から Cloudflare Pages 等を足してよい。
- UI/テーマは [todo-app](https://github.com/neko-rr/todo-app) に揃える。
- モバイル（Expo）は後期。**同じ API + 同じ Auth 発行体**を前提にしたフォルダだけ先に空ける。

## 認証の結論（質問への答え）

### YES: 発行体は todo-app と同じにする

| 層 | 方針 |
|----|------|
| **Identity** | **Supabase Auth**（既存プロジェクト） |
| **Web セッション** | todo-app と同じ **`@supabase/ssr` + Cookie + middleware で refresh** |
| **API 認可** | FastAPI で **`Authorization: Bearer <access_token>`** を検証（Flask 全ページ保護は使わない） |
| **行保護** | 従来どおり Postgres **RLS** + `members_id = auth.uid()` |
| **モバイル（将来）** | 同一 Auth。トークンは SecureStore 等。API には同じく Bearer |

### NO: Dash 時代の Flask 認証をそのまま持ち込まない

現行 oshi の **旧** 手順は [docs/archive/oauth-dash-flask.md](../../docs/archive/oauth-dash-flask.md)（旧 `.cursor/rules/OAuth.md`）。Flask が PKCE 交換 + HttpOnly Cookie で Dash 入口を守る形。これは「SSR できない Python UI を 1 プロセスで守る」ための形で、**v2 では使わない**。

FastAPI + Next では分業する:

```text
[ブラウザ]
  Next.js  (@supabase/ssr / Cookie セッション)
       │  ログイン・セッション更新・保護ページのゲート
       │
       │  API 呼び出し時: access_token を Bearer で付与
       ▼
  FastAPI  (JWT 検証 → members_id 取得 → ユースケース)
       │  ユーザー JWT 付きの Supabase クライアント or 検証済み ID
       ▼
  Supabase Auth / Postgres RLS / Storage
```

### プロバイダ（メール or Google）

- **基盤は同じ**（Supabase Auth）。
- todo-app 現状は **メール/パスワード** 中心のスキャフォールド。
- oshi は **Google OAuth** を既に想定済み。
- **推奨**: 両方を Supabase で有効化し、UI は todo-app の auth ルート構成を土台に Google ボタンを追加する。**別 OAuth サーバーは自前実装しない。**

### FastAPI 側の最小契約（Phase 1 で実装）

1. 必須ヘッダ: `Authorization: Bearer <jwt>`
2. JWT は Supabase 発行の access token を検証（JWKS / 公式の検証方法）
3. `sub`（= `auth.users.id` = **`members_id`）** を Request コンテキストに載せる
4. 業務 API はサービスロールで RLS を無視しない（原則ユーザー JWT）。管理バッチだけ service role
5. 公開エンドポイントは `/health` と（必要なら）ドキュメントのみ

---

## monorepo 配置案（todo-app 互換 + 拡張）

todo-app は `frontend` / `backend` / `packages/*`。oshi v2 はモバイル枠を含め **apps プレフィックス**を推奨（後で Expo を足しやすい）。

```text
oshi-app-v2/                    # 新規リポジトリ（提案名）
  package.json                  # pnpm workspaces ルート
  pnpm-workspace.yaml
  pnpm-lock.yaml
  .gitignore
  .env.example                  # ルートは説明のみ。実値は Git に入れない
  README.md
  AGENTS.md                     # エージェント入口（短い正本）

  apps/
    web/                        # Next.js（todo-app frontend 相当）
      package.json
      next.config.ts
      src/
        app/                    # App Router
        components/
        lib/                    # supabase client/server/middleware
        styles/                 # colors.css 等（todo-app から移植）
      src/middleware.ts

    api/                        # FastAPI（todo-app backend 相当）
      requirements.txt
      Dockerfile                # Render Web Service 用
      app/
        main.py
        core/                   # settings, security
        deps/                   # get_current_user 等
        routers/
          health/
          me/                   # 認証確認用の最小 API
        services/               # ドメインロジック（後で oshi services 移植）
        schemas/
        repositories/

    mobile/                     # 空ディレクトリ + README のみ（Phase 4）
      README.md

  packages/
    shared/                     # TS: API パス定数・共有型（OpenAPI 生成でも可）
      package.json
      src/

  supabase/                     # 既存マイグレーションの正本をここへ寄せる（継続利用）
    migrations/
    config.toml

  .cursor/
    rules/
      file_structure.md
      auth.md
      api_contract.md
      database_configuration.md   # 既存を移植（用語 members_id 維持）
      spec.md                     # 製品仕様は既存を移植
    skills/
      post-change-verify/
        SKILL.md
```

### 起動スクリプト（ルート package.json イメージ）

```json
{
  "name": "oshi-app",
  "private": true,
  "packageManager": "pnpm@10.28.0",
  "scripts": {
    "dev:web": "pnpm -C apps/web dev",
    "dev:api": "pnpm -C apps/api dev",
    "build:web": "pnpm -C apps/web build",
    "build:shared": "pnpm -C packages/shared run build"
  }
}
```

API の `dev` は `uvicorn app.main:app --reload` を `apps/api` の script で呼ぶ想定。

---

## 環境変数（既存を踏襲しつつ Next 名に合わせる）

| 用途 | 変数（案） | 備考 |
|------|------------|------|
| Web 公開 | `NEXT_PUBLIC_SUPABASE_URL` | todo-app と同名 |
| Web 公開 | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | todo-app と同名 |
| Web → API | `NEXT_PUBLIC_API_BASE_URL` | 例 `http://127.0.0.1:8000` |
| API | `SUPABASE_URL` | サーバー専用 |
| API | `SUPABASE_JWT_SECRET` または JWKS URL | JWT 検証用。**ログ出力禁止** |
| API | `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | service role はバッチ・管理のみ |
| API | `CORS_ORIGINS` | Next の origin |
| 既存 oshi 互換 | 旧 `PUBLIC_SUPABASE_*` | 移行後は新名に統一し `.env.example` を正とする |

Render には **API 用のみ**。Pages/ローカル Web には `NEXT_PUBLIC_*` のみ。

---

## 配置（当面・サービス未開始）

| コンポーネント | 当面 | 備考 |
|----------------|------|------|
| FastAPI | Render（現状と同様） | Docker + uvicorn |
| Next.js | ローカル優先 → 後で Pages 等 | 未公開なら急がない |
| Supabase | **既存プロジェクトそのまま** | Auth URL に Next の callback を追加 |
| Expo | 後回し | apps/mobile の枠だけ |

Supabase Dashboard の **Redirect URLs** に追加する例:

- `http://127.0.0.1:3000/auth/confirm`
- `http://127.0.0.1:3000/**`（開発ポリシーに合わせて）
- 本番 Web オリジン

Flask 時代の `.../auth/callback` は v2 では使わない（残しても害は少ないがドキュメントから外す）。

---

## 最小 rules / skills（ドラフト配置）

実装前の正本ドラフトはリポジトリ内:

| ファイル | 役割 |
|----------|------|
| [docs/migration/v2/AGENTS.md](../../docs/migration/v2/AGENTS.md) | エージェント入口 |
| [docs/migration/v2/rules/file_structure.md](../../docs/migration/v2/rules/file_structure.md) | 新 monorepo 配置 |
| [docs/migration/v2/rules/auth.md](../../docs/migration/v2/rules/auth.md) | 認証の正本（Flask 非推奨） |
| [docs/migration/v2/rules/api_contract.md](../../docs/migration/v2/rules/api_contract.md) | HTTP 契約 |
| [docs/migration/v2/skills/post-change-verify/SKILL.md](../../docs/migration/v2/skills/post-change-verify/SKILL.md) | 変更後検証 |

新規リポジトリ作成時に `docs/migration/v2/*` をルートの `AGENTS.md` / `.cursor/*` へコピーする。

---

## Phase 1（次の実行・要承認）でやること

1. 新規 GitHub リポジトリ作成（または空 monorepo 初期化）
2. `apps/web` を todo-app frontend をベースにスキャフォールド（テーマ CSS 移植）
3. `apps/api` に health + `/me`（Bearer 必須）のみ
4. 上記 rules/skills を `.cursor` に配置
5. ローカルで「ログイン → /me が自分の id を返す」縦スライス確認

**まだやらない**: グッズ登録移植、ML、Expo、Cloudflare 本設定、Flask/Dash の削除作業。

---

## 既存 `.cursor/rules` との関係

| 現行（Dash） | v2 |
|--------------|-----|
| `file_structure.md`（修正禁止・Dash） | v2 用ドラフトで置き換え対象 |
| `OAuth.md`（Flask PKCE） | **削除** → 履歴は `docs/archive/oauth-dash-flask.md`。正本は `auth.md`（Supabase SSR + Bearer） |
| `database_configuration.md` / `spec.md` | 用語・機能要件は継続。ファイルは新リポへコピー後にパス修正 |
| `post-change-verify`（Python Dash） | Next + FastAPI 用に差し替え |
