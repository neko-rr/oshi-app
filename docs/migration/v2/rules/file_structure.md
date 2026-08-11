# ファイル構成（Next.js + FastAPI monorepo）

Apply Mode: Always Apply（新リポジトリで使用）

# ルート

```text
apps/web/          # Next.js
apps/api/          # FastAPI
apps/mobile/       # Expo（後から）。初期は README のみ可
packages/shared/   # 共有 TS（API パス・型）
supabase/          # migrations / config
.cursor/rules/
.cursor/skills/
AGENTS.md
README.md
package.json
pnpm-workspace.yaml
.env.example
```

# apps/web

```text
src/app/                 # App Router（auth, 保護ページ, 各機能）
src/components/          # UI
src/lib/
  client.ts              # ブラウザ用 Supabase
  server.ts              # サーバ用 Supabase
  middleware.ts          # セッション更新ロジック
src/middleware.ts        # Next middleware 入口
src/styles/              # colors.css / theme（todo-app 寄せ）
```

- 認証画面は `/auth/*`（login, sign-up, confirm 等）に置く（todo-app に倣う）。
- 業務データ取得の第一選択は **FastAPI**。Supabase クライアント直叩きは Auth と軽い Storage 用途に限定する方針。

# apps/api

```text
app/
  main.py
  core/          # settings, cors, logging
  deps/          # get_current_user, get_supabase
  routers/       # 機能別 APIRouter
  services/      # DB/外部API を含むユースケース（UI 非依存）
  schemas/       # pydantic 入出力
  repositories/  # 必要ならクエリ寄せ
requirements.txt
Dockerfile
```

- ルーターは薄く。DB 詳細は `services/` へ。
- 1 機能 = 1 router パッケージ（例: `routers/products/`）を基本とする。

# packages/shared

- API ベースパス文字列、共有 DTO 型のみ。
- React / FastAPI 実装依存を持ち込まない。

# 禁止・注意

- `.env` を Git に含めない。`.env.example` のみ。
- `service_role` キーを `NEXT_PUBLIC_*` に置かない。
- 旧 Dash 構成（`app.py` / `pages/` / `features/*/controller.py`）は v2 では使わない。
