# 用語集（glossary）— 旧なりゆき → v2 の正

実装・設計の英語名を揃えるための対照表。  
**DB 物理名をこの表だけで変えない。** 変わるときはマイグレーション。

## テナンシー・認証

| 意味 | 正 | 旧・揺れ | 備考 |
|------|----|----------|------|
| ログインユーザーの UUID | `members_id` | `owner_id`, `user_id` | `auth.users.id` / JWT `sub` |
| 発行体 | Supabase Auth | 自前 JWT サーバ | |
| Web セッション | `@supabase/ssr` Cookie | Flask HttpOnly 入口 | archive 参照 |
| API 認証 | `Authorization: Bearer` | Cookie を FastAPI が直接読む | |

## ドメイン（グッズ）

| 意味 | 正（アプリ層） | DB / 旧コードでの現れ方 | 注意 |
|------|----------------|-------------------------|------|
| 登録グッズ1件 | `product` / `registration_product` | `registration_product_information` | ギャラリーの主役は product |
| その ID | `registration_product_id` | 同左 | |
| 画像ファイル / Storage オブジェクト | `photo` / `image` | `photo` テーブル, `photo_id` | **製品≠写真** |
| 製品向け画像サービス | `storage_service` / `photo_storage` | 巨大な `photo_service` | 分割推奨 |
| 製品 CRUD | `product_service` | `photo_service` 内の insert 等 | |
| 登録ウィザード | `register` | `/register/*` | URL は kebab のままで可 |
| 一覧 UI | `gallery` | `/gallery` | |
| 収納場所 | `receipt_location` | 同左（名前は歴史的） | アプリだけ `storage` にしない |
| カテゴリタグ | `category_tag` | 同左 | |
| カラータグ | `color_tag` | 同左 | |
| 製品×カラー | `registration_product_color_tag` | 同左 | |

## レイヤ・ファイル役割

| 意味 | v2 の正 | Dash 旧 | 使わない |
|------|---------|---------|----------|
| HTTP 入口 | `routers/<domain>/` | Flask routes / Dash pages | `controller.py` を業務ロジック置き場に |
| ユースケース | `services/*_service.py` | `services/*` | UI から DB 直叩き |
| 画面 | `apps/web/src/app/.../page.tsx` | `pages/*.py` | |
| 共通 UI | `components/` | `components/`, `features/*/components` | |
| 認証 rule | `auth.md` | `OAuth.md`（削除済） | archive のみ |

## 環境変数

| 意味 | v2 の正 | 旧 |
|------|---------|-----|
| Supabase URL（Web） | `NEXT_PUBLIC_SUPABASE_URL` | `PUBLIC_SUPABASE_URL` |
| Publishable key（Web） | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` |
| API ベース（Web） | `NEXT_PUBLIC_API_BASE_URL` | （なし / 同一オリジン） |
| アプリ公開 URL（旧 Flask） | Site URL / Redirect（Supabase 設定） | `APP_BASE_URL` |

## URL（Web）

| 画面 | 正の path | 旧 path |
|------|-----------|---------|
| ログイン | `/auth/login` | `/login` |
| 認証確認 | `/auth/confirm` | `/auth/callback` |
| ホーム | `/` または製品へリダイレクト | `/` |
| ギャラリー | `/gallery` | 同左 |
| 登録 | `/register/...` | 同左 |
| 設定 | `/settings/...` | 同左（segment は kebab） |

## 意識的に「直さない」もの

- Postgres テーブル・列の長い正式名（`registration_product_information` 等）
- `receipt_location` という英単語の違和感（データ互換優先）
- 過去の plan ファイル名（日本語）。新規の **コード** には使わない
