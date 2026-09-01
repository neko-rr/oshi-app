<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# 環境変数コントラクト（キー名のみ）

**このファイルに実値を書くな。** テンプレは `apps/web/.env.example` / `apps/api/.env.example`。  
ローカル実体: `apps/web/.env.local` / `apps/api/.env`（Git 禁止）。

凡例:

| 印 | 意味 |
|----|------|
| **必須** | そのホストでアプリが動くために必要 |
| **任意** | 機能オン時のみ |
| **禁止** | 置かない／置いても無視／公開面に出さない |
| **公開可** | ブラウザに載ってよい（publishable / 公開 URL） |
| **秘密** | Dashboard / ローカルのみ。リポジトリ・CF・チャットに出さない |

---

## 一文サマリ

| ホスト | 置くもの | 置かないもの |
|--------|----------|--------------|
| **ローカル Web** (`apps/web/.env.local`) | Supabase URL + publishable + API の公開 URL | secret / service_role / JWT 秘密 |
| **ローカル API** (`apps/api/.env`) | Supabase URL + publishable（+ CORS）。JWKS は URL から自動可 | JWT Legacy Secret に頼らない |
| **Render（API）** | 上と同じサーバー系。本番 `CORS_ORIGINS` | 開発用 localhost を CORS に残さない |
| **Cloudflare（Web）** | `NEXT_PUBLIC_*` のみ | あらゆる secret / service_role / DB URL / IO キー |
| **Supabase Dashboard** | Auth URL・Signing Keys・（必要なら）Storage | キーを Git にコピーしない |

---

## Web（Next.js / Cloudflare）

| キー | 必須 | 公開 | ローカル | Cloudflare | 備考 |
|------|------|------|----------|------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | **必須** | 公開可 | `.env.local` | Pages/Workers env | プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **必須** | 公開可 | 同上 | 同上 | **anon/publishable のみ**。service_role 禁止 |
| `NEXT_PUBLIC_API_BASE_URL` | **必須** | 公開可 | 開発は `http://127.0.0.1:8000` | **HTTPS の Render URL** | 末尾スラッシュなし推奨 |
| `NEXT_PUBLIC_BASE_URL` | 任意 | 公開可 | 任意 | 本番 Web のオリジン | リダイレクト組み立て用 |
| `AUTH_GATE_BYPASS` | 任意（開発のみ） | **非公開** | `.env.local` のみ | **置くな** | `=1` かつ非本番のときだけ、Supabase 未設定でも**業務ルート**を通す。通常は未設定。`/dev`（Design Lab）は非本番なら未ログイン可（別途） |

**CF に置いてはいけない例:** `SUPABASE_SECRET_KEY` / `SUPABASE_JWT_SECRET` / `DATABASE_URL` / `IO_*` / `AUTH_GATE_BYPASS` / あらゆる `*_SECRET*`。

---

## API（FastAPI / Render）

| キー | 必須 | 秘密 | ローカル | Render | 備考 |
|------|------|------|----------|--------|------|
| `SUPABASE_URL` | **必須** | 公開 URL だがサーバー専用管理 | `.env` | Dashboard | |
| `SUPABASE_PUBLISHABLE_KEY` | **必須** | 公開可だがサーバー env で管理 | 同上 | 同上 | ユーザー JWT + RLS 経路 |
| `SUPABASE_JWKS_URL` | 任意 | — | 同上 | 同上 | 未設定時は `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` |
| `CORS_ORIGINS` | 本番は **必須** | — | 未設定時 localhost 既定 | **本番 Web オリジンのみ**（カンマ区切り） | 開発用 localhost を本番に残すな |
| `SUPABASE_SECRET_KEY` | **置かない推奨** | 秘密 | 例にあるが **現行コード未使用** | バッチ専用のときだけ | 通常 API 経路に使うな |
| `SUPABASE_JWT_SECRET` | **禁止（検証に使わない）** | 秘密 | 設定しても **無視** | 設定するな | JWKS のみ |
| `DATABASE_URL` / `SUPABASE_DB_URL` | 任意 | 秘密 | docs 生成スクリプト用 | アプリ実行には不要 | Git・CF 禁止 |
| `IO_INTELLIGENCE_API_KEY` | 任意 | 秘密 | Assist オン時 | 同上 | `IO_LIVE_CALLS=1` のとき実呼出 |
| `IO_LIVE_CALLS` | 任意 | — | 既定オフ想定 | 必要なときだけ `1` | |
| `IO_INTELLIGENCE_API_URL` / `IO_*_MODEL*` | 任意 | — | モデル名など | 同上 | キー本体ではない |
| `RAKUTEN_APPLICATION_ID` | 任意 | 秘密寄り | バーコード連携時 | 同上 | |
| `RAKUTEN_AFFILIATE_ID` | 任意 | — | 同上 | 同上 | |
| `RAKUTEN_LIVE_CALLS` | 任意 | — | 既定オフ | 同上 | |

テンプレ正本: `apps/api/.env.example`（Pydantic: `apps/api/app/core/settings.py`）。

---

## ホスト別チェックリスト（GitHub 公開前）

### リポジトリに載せてよい

- [ ] `*.env.example`（空またはダミー）
- [ ] 本ファイル・`WAKE_UP.md`（キー名のみ）
- [ ] `NEXT_PUBLIC_*` の **名前** の説明

### リポジトリに載せない

- [ ] `apps/web/.env.local` / `apps/api/.env` / ルート `.env`
- [ ] service_role / JWT 秘密 / DB URL / IO キーの実値
- [ ] Cookie・Bearer・署名 URL の全文
- [ ] 個人のメール・実ユーザーデータ・本番ダンプ

### Render

- [ ] `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`
- [ ] `CORS_ORIGINS=<本番 Cloudflare オリジン>`
- [ ]（任意）IO / 楽天は Live フラグとセット
- [ ] `SUPABASE_JWT_SECRET` なし

### Cloudflare

- [ ] 上記 3 つの `NEXT_PUBLIC_*` のみ
- [ ] secret 系ゼロ

### Supabase（Dashboard・Git 外）

- [ ] JWT Signing Keys 有効（JWKS の `keys` が空でない）
- [ ] Site URL / Redirect = 本番 Web（＋必要ならローカル）

---

## 秘密・個人情報まわり（仕組み）

| 層 | 役割 |
|----|------|
| `.gitignore` | `.env` / `.env.*` を無視（`!.env.example` のみ許可） |
| `core.hooksPath=.githooks` | commit 前に `secret_guard` → `naming_check` |
| `scripts/secret_guard.py` | `.env` 実ファイル・鍵っぽい文字列・危険な shell を拒否 |
| `.cursor/hooks.json` | エージェントの shell / 書込でも同ガード |
| `security.mdc` | チャット・ログに秘密を出さない |

**クローン後は必ず**（各マシン・ローカルのみ）:

```powershell
git config core.hooksPath .githooks
```

詳細: [.githooks/README.md](../../.githooks/README.md)

### 限界（過信しない）

- hooks は **秘密・鍵パターン** が主。氏名・メール・写真パスなど「一般的な個人情報」をすべて検知するわけではない。
- `--no-verify` や hooks 未設定クローンではガードが効かない → **AGENTS どおり `--no-verify` 禁止**、公開前に `git status` で `.env` が無いか確認。
- GitHub に載せたあとも、漏れたら **即ローテ**（値はチャットに残さない）。skill: `secure-change-checklist`。

---

## 関連

- 人向け ToDo: [../WAKE_UP.md](../WAKE_UP.md)
- 例ファイル: `apps/web/.env.example` / `apps/api/.env.example`
- ルール: `.cursor/rules/deploy.mdc` / `security.mdc` / `auth.mdc`
