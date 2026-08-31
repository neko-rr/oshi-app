<!-- 更新: ARCHIVE寄り — 移行メモ。現行正本はルート AGENTS.md と .cursor/rules/*.mdc。凡例: docs/README.md -->
# 用語集（glossary）— 旧なりゆき → v2 の正

実装・設計の英語名を揃えるための対照表。  
**DB 物理名をこの表だけで変えない。** 変わるときはマイグレーション。  
DB 詳細: [docs/db/schema-catalog.md](../../db/schema-catalog.md) / [docs/db/naming.md](../../db/naming.md)

## テナンシー・認証

| 意味 | 正 | 旧・揺れ | 備考 |
|------|----|----------|------|
| ログインユーザーの UUID | `members_id` | `owner_id`, `user_id` | `auth.users.id` / JWT `sub` |
| 発行体 | Supabase Auth | 自前 JWT サーバ | |
| Web セッション | `@supabase/ssr` Cookie | Flask HttpOnly 入口 | archive 参照 |
| API 認証 | `Authorization: Bearer` | Cookie を FastAPI が直接読む | |

## ドメイン（グッズ）

| 意味 | 正（アプリ層） | DB 物理名 | 注意 |
|------|----------------|-----------|------|
| 登録グッズ1件 | `product` / `registered_product` | `registered_product` | 旧 `registration_product_information` |
| その ID | `registered_product_id` | 同左 | 旧 `registration_product_id` |
| 画像ファイル / Storage オブジェクト | `photo` / `image` | `photo` | **製品≠写真** |
| 製品向け画像サービス | `storage_service` / `photo_storage` | — | |
| 製品 CRUD | `product_service` | — | |
| 登録ウィザード | `register` | — | URL は kebab 可 |
| 一覧 UI | `gallery` | — | |
| 収納場所 | `storage_location` | `storage_location` | 旧 `receipt_location`。UI 文言は「収納場所」 |
| カテゴリタグ | `category_tag` | 同左 | |
| カラータグ | `color_tag` | 同左 | |
| 製品×カラー | `registered_product_color_tag` | 同左 | 旧 `registration_product_color_tag` |
| 作品 | `work` | `work` | 旧 `works_information`。PK `work_id` |
| 会員プロフィール | `member` | `member` | 旧 `member_information` |

## レイヤ・ファイル役割

| 意味 | v2 の正 | Dash 旧 | 使わない |
|------|---------|---------|----------|
| HTTP 入口 | `routers/<domain>/` | Flask routes / Dash pages | `controller.py` を業務ロジック置き場に |
| ユースケース | `services/*_service.py` | `services/*` | UI から DB 直叩き |
| 画面 | `apps/web/src/app/.../page.tsx` | `pages/*.py` | |
| 共通 UI | `components/` | `components/`, `features/*/components` | |
| 認証 rule | `auth.mdc` | `OAuth.md`（削除済） | archive のみ |

## 環境変数

| 意味 | v2 の正 | 旧 |
|------|---------|-----|
| Supabase URL（Web） | `NEXT_PUBLIC_SUPABASE_URL` | `PUBLIC_SUPABASE_URL` |
| Publishable key（Web） | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `PUBLIC_SUPABASE_*` |
| API ベース（Web） | `NEXT_PUBLIC_API_BASE_URL` | （なし / 同一オリジン） |

## URL（Web）

| 画面 | 正の path | 旧 path |
|------|-----------|---------|
| ログイン | `/auth/login` | `/login` |
| 認証確認 | `/auth/confirm` | `/auth/callback` |
| ギャラリー | `/gallery` | 同左 |
| 製品詳細 | `/gallery/[registered_product_id]` | `/gallery/[registration_product_id]` |
| 登録 | `/register/...` | 同左 |
| 設定・収納場所 | `/settings/storage-locations` | `/settings/receipt-locations` |

## 意識的に維持するもの

- テナント列名 `members_id`（改名しない）
- カタログの **日本語名**（人間の理解用。アプリでは使わない）
- 過去の plan ファイル名（日本語）。新規の **コード** には使わない
