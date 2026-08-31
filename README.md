# oshi-app（Next.js + FastAPI monorepo）

推し活グッズ管理。**共同作業・別セッションの入口は [AGENTS.md](AGENTS.md)**。

**ライセンス:** [LICENSE](LICENSE) — Copyright (c) 2026 neko-rr. **All Rights Reserved**（無断複製・再配布・派生開発禁止）。  
旧プロトタイプ: [oshi-app-prototype](https://github.com/neko-rr/oshi-app-prototype)

## 構成

```text
apps/web         Next.js（Auth UI + 画面）
apps/api         FastAPI（JWKS で JWT 検証 + 業務 API）
apps/mobile      Expo（枠のみ）
packages/shared  共有型・API パス
.cursor/rules    エージェント用ルール（*.mdc）
```

## 前提

- Node.js 24+ / pnpm 10+
- Python 3.11+
- Cursor プロファイル: **Web-Oshi**（任意）

## セットアップ

```powershell
pnpm install
cd apps/api
python -m venv .venv
# Windows:
.\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

環境変数（**実値は Git に入れない**）:

| ファイル | 用途 |
|----------|------|
| `apps/web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL` / `PUBLISHABLE_KEY` / `API_BASE_URL` |
| `apps/api/.env` | `SUPABASE_URL` / `PUBLISHABLE_KEY` /（任意）`JWKS_URL` |

例は各 `.env.example`。ルートの `.env` は API からは読まない。  
**ホスト別の必須／禁止一覧:** [docs/deploy/env-contract.md](docs/deploy/env-contract.md)

## 起動

```powershell
pnpm dev:api    # apps/api/.venv の Python を自動使用
pnpm dev:web
```

- Web: http://127.0.0.1:3000
- API: http://127.0.0.1:8000/health

## テスト

```powershell
pnpm -C apps/api test
# または
pnpm test:api
```

ルートで素の `python -m pytest` を使うと venv 外になり失敗しやすい。**必ず `apps/api/.venv` 経由**。

## 認証（要約）

- Web: `@supabase/ssr` + Cookie
- API: Bearer + **JWKS**（Legacy JWT Secret は使わない）
- Supabase Dashboard で JWT Signing Keys を有効化し、JWKS の `keys` が空でないこと
- 詳細: `.cursor/rules/auth.mdc`

## 起きてから（クラウド）

1. Supabase Redirect に Next の `/auth/confirm` 等
2. Render に API、Cloudflare に Web（`.cursor/rules/deploy.mdc`）
3. Dashboard にのみ秘密を設定
4. 手順メモ: [docs/WAKE_UP.md](docs/WAKE_UP.md)

## エージェント / 共同開発

| 読むもの | 内容 |
|----------|------|
| [AGENTS.md](AGENTS.md) | 絶対ルール・用途マップ |
| `.cursor/rules/README.md` | `.mdc` の頻度（alwaysApply / globs） |
| **文書の更新区分** | **[docs/README.md](docs/README.md)**（手 / 自動 / エージェント） |
| DB・スキーマ | [docs/db/README.md](docs/db/README.md)（生成: `scripts/generate_db_docs.py`） |
| 製品仕様 | [docs/product/README.md](docs/product/README.md)（生成: `scripts/generate_product_docs.py`） |
| デザイン | [docs/design/README.md](docs/design/README.md)（入口: [DESIGN.md](DESIGN.md)） |
| `docs/refs/official-links.md` | 公式 URL 索引（正本ではない） |
