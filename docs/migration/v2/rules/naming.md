<!-- 更新: ARCHIVE寄り — 移行メモ。現行正本はルート AGENTS.md と .cursor/rules/*.mdc。凡例: docs/README.md -->
# 命名規則（詳細表）

エージェント向けの短い正本は [`.cursor/rules/naming.mdc`](../../../.cursor/rules/naming.mdc)。  
このファイルは表・例の詳細参照。

**構成の正**: [file_structure.md](file_structure.md)  
**用語対応（旧→新）**: [../glossary.md](../glossary.md)  
**API 形**: [api_contract.md](api_contract.md)

---

## 1. 言語別の字形

| 対象 | 規則 | 例 |
|------|------|-----|
| Python モジュール / パッケージ | `snake_case` | `product_service.py`, `routers/products/` |
| Python 関数・変数 | `snake_case` | `get_current_user`, `members_id` |
| Python クラス | `PascalCase` | `ProductCreate` |
| Python 定数 | `UPPER_SNAKE` | `MAX_UPLOAD_BYTES` |
| TypeScript/TSX 変数・関数 | `camelCase` | `membersId`（**JSON は下記**） |
| React コンポーネント | `PascalCase` ファイル | `LoginForm.tsx`, `Header.tsx` |
| Next App Router の **ルート segment** | `kebab-case` | `receipt-location-tags`, `sign-up` |
| 共有パッケージのパス定数 | `camelCase` か `UPPER` をパッケージ内で統一 | `API_PATHS.products` |
| CSS カスタムプロパティ | kebab + プレフィックス可 | `--primary`, `--card-foreground` |
| env キー | `UPPER_SNAKE` | `NEXT_PUBLIC_API_BASE_URL` |
| DB テーブル・列 | `snake_case`・法則は [docs/db/naming.md](../../../db/naming.md) | `registered_product` |
| Git ブランチ | `type/short-kebab` | `feat/product-list`, `fix/auth-jwt` |
| コミットメッセージ | 英語 short imperative 可 | `Add product list API` |
| ドキュメント・コメント | **日本語**（コード識別子は英語） | |

### JSON / API フィールド（重要）

- **ワイヤ形式（HTTP JSON）は `snake_case`** に統一する。
  - 理由: Postgres / Pydantic / 既存 DB と一致。フロントは受け取り側で camel にせず **snake のまま**扱ってよい（変換レイヤを増やさない）。
- 例: `{ "members_id": "...", "registered_product_id": 1 }`
- TypeScript 型も同じキー名（`"members_id"`）を書く。camel 変換は導入しない（導入する場合は packages/shared に一本化し、この rule を先に改定）。

---

## 2. monorepo パスとファイルの置き場

```text
apps/web/src/
  app/<route-segments>/     # URL と 1:1。segment は kebab-case
  components/               # 共有 UI。機能横断
  components/ui/            # プリミティブ（button, input）— todo-app 寄せ
  features/<domain>/        # 任意: 機能単位の UI 塊（page 専用なら app 配下で可）
  lib/                      # supabase, utils — 薄いヘルパー
  hooks/                    # useXxx.ts
  styles/

apps/api/app/
  main.py
  core/                     # settings, security, logging
  deps/                     # FastAPI Depends
  routers/<domain>/         # HTTP だけ（薄い）
  schemas/<domain>.py       # または schemas/<domain>/
  services/<domain>_service.py
  repositories/             # 生クエリが厚いときだけ

packages/shared/src/        # パス定数・共有型のみ

supabase/migrations/        # YYYYMMDDHHMMSS_description_snake.sql
```

### ファイル名の型パターン

| 種類 | 名前 | 置き場 |
|------|------|--------|
| FastAPI ルータ | `router.py` をパッケージ内、または `products.py` | `routers/products/` |
| ユースケース | `<domain>_service.py` | `services/` |
| 入出力スキーマ | `<domain>.py`（Create/Update/Read を同ファイル可） | `schemas/` |
| React ページ | Next は `page.tsx` 固定 | `app/.../page.tsx` |
| React コンポーネント | `PascalCase.tsx` | `components/` 等 |
| フック | `use-kebab.ts` または `useXxx.ts`（リポ内どちらかに統一。**新規は `useXxx.ts`**） | `hooks/` |
| テスト | `test_<module>.py` / `*.test.ts` | `tests/` / コロケートどちらかをドメインで統一。**API は `apps/api/tests/`** |
| skill | `SKILL.md` をディレクトリごと | `.cursor/skills/<name>/` |
| rule | `snake` または 単一語 `.md` | `.cursor/rules/` |

### 禁止・非推奨（新規）

| やらない | 代わり |
|----------|--------|
| `controller.py`（Dash コールバック） | Next の page/events + API service |
| `photo_service` に製品 CRUD を全部載せる | `product_service` / `storage_service` に責務分割 |
| ルートに `utils.py` 巨大単一ファイル | `lib/` または domain 配下の小モジュール |
| `foo_final2.py` / `temp_` / `copy_` | 捨てる or 正式名へ |
| 日本語ファイル名の **コード** | 英語。plan の日本語 MD は可 |
| `owner_id` を新コードでテナント列に使う | 既存どおり **`members_id`** |
| `*_Service` クラス乱立（不要なら関数でよい） | FastAPI は関数 + 薄い deps を優先可 |

---

## 3. ドメイン用語（アプリ層の英語）

画面・モジュール名に使う **正** の単語。日本語 UI 文言は別。

| 概念（日本語） | 正（英語） | 避けたい揺れ |
|----------------|------------|--------------|
| 認証済みユーザー所有 | `members_id` | `owner_id`, `user_id`（JWT sub のアプリ名は members_id） |
| 登録されたグッズ1件 | `product` / `registered_product` | コード上すべてを `photo` と呼ぶ |
| 製品写真・画像オブジェクト | `photo` / `image` | product と混同した `photo_service` 一枚岩 |
| ギャラリー画面 | `gallery` | `list` だけの曖昧名 |
| 登録フロー | `register` | `regist`, `entry` |
| 収納場所 | `storage_location` | 旧 `receipt_location`。UI 文言は「収納場所」 |
| カテゴリータグ | `category_tag` | `category` だけ |
| カラータグ | `color_tag` | `colour` |
| ダッシュボード | `dashboard` | `home-stats` 等の独自短縮 |
| 設定 | `settings` | `config` 画面名 |

DB テーブル名は [docs/db/schema-catalog.md](../../../db/schema-catalog.md) と `supabase/migrations/` を正とし、**マイグレーションなしの改名はしない**。

---

## 4. HTTP / ルータ命名

- パス: **複数形リソース** + kebab が必要な箇所のみ  
  - 良い: `/products`, `/products/{product_id}`, `/me`  
  - 避け: `/getProducts`, `/product_list`
- FastAPI の `APIRouter(prefix="/products", tags=["products"])`
- ルータ関数名: 動詞 + 名 `list_products`, `create_product`, `get_product`
- エラー `code`: `UPPER_SNAKE`（`VALIDATION_ERROR`）

詳細は api_contract.md。

---

## 5. 環境変数命名

| 用途 | プレフィックス | 例 |
|------|----------------|-----|
| ブラウザ公開 | `NEXT_PUBLIC_` | `NEXT_PUBLIC_SUPABASE_URL` |
| API サーバのみ | プレフィックスなし or `API_` | `SUPABASE_URL`, `CORS_ORIGINS` |
| 旧 Dash 名 | **新規に増やさない** | `PUBLIC_SUPABASE_*` は移行表のみで言及 |

秘密は [security.md](security.md)。`.env` 実体はコミット禁止。

---

## 6. ドキュメント・エージェント資産

| 種類 | 規則 |
|------|------|
| rules | 短い英語系ファイル名: `auth.md`, `naming.md`, `security.md` |
| skills | ディレクトリ `kebab-or-snake`: `post-change-verify` |
| archive | `docs/archive/<topic>-<legacy-stack>.md` |
| plans | 日本語タイトル可。実装が終わったら正本へ移し plan に依存しない |
| cursor.md | ルート `cursor.md` に統一（`Cursor.md` と混ぜない） |

---

## 7. エージェントが新規ファイルを作るとき（必須チェック）

1. **置き場**は file_structure（v2）+ 本 rule の表に合うか  
2. **ファイル名**は上表の型パターンか  
3. **用語**は glossary の「正」か（`photo` と `product` を取り違えていないか）  
4. **JSON キー**は snake_case か  
5. 既存 DB 列を勝手に rename していないか  
6. 迷ったら **既存の近い domain ディレクトリに寄せる**。新しい top-level を安易に増やさない  

手順の skill: [docs/migration/v2/skills/new-file-naming/SKILL.md](../../docs/migration/v2/skills/new-file-naming/SKILL.md)  
検査 CLI: `python scripts/naming_check.py`（ステージ / パス）

---

## 8. 段階適用

| フェーズ | 方針 |
|----------|------|
| monorepo 新規・改修コード（`apps/*` / `packages/*`） | **本 rule 100%**（Dash アプリコードはリポに残っていない） |
| DB | 用語は [glossary.md](../../glossary.md)。物理名変更はマイグレーション計画が先 |
| 履歴参照 | Dash 構成は `.cursor/rules/reference/file_structure-dash.md`（ARCHIVE）のみ。新規設計に使わない |
