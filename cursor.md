# Cursor 開発メモ（重要連絡）

## 2026-09-03: v2 Must 本線を「ほぼ移行完了」として文書同期

- 新設: `docs/product/v2_status.md`
- `feature_status` / roadmap: 登録クラスタ・検索・privacy・licenses 等を shipped
- 残 partial（Must）: `responsive_web` / `theme_colors`（推し色スウォッチ）
- Phase 2・モバイル・deferred は未完了のまま明記
- acceptance: `search.md` 追加。`generate_product_docs.py` 再実行

## 2026-09-03: 楽天API 再登録完了・ドキュメント同期

- Developer 再登録済み（市場APIスコープ / Webアプリ＋許可サイト）
- ローカル疎通: `lookup_by_keyword` → success（秘密はチャット・Git に出さない）
- env: `RAKUTEN_APPLICATION_ID` + `RAKUTEN_ACCESS_KEY` + `RAKUTEN_ORIGIN` + `RAKUTEN_LIVE_CALLS`
- docs: flows/register・assist_external_apis・feature_status(`product_lookup`=shipped)・roadmap・acceptance・official-links
- `.env.example` はコメントのみ（実値禁止）

## 2026-09-02: ギャラリー Web UX（Lab B 採用）

- Lab: `/dev/design-lab` で画面「ギャラリー」「ギャラリー詳細」
- 本番: 写真主役グリッド、カテゴリ/収納チップ、`has_more` もっと見る、DB 側 `q`、詳細→一覧のクエリ復元、編集は `<details>`
- API: `GET /products` に `category_tag_id` / `storage_location_id` / `has_more`
- Mobile ギャラリーは未着手

## 2026-09-02: 楽天API 形を新仕様へ（のち再登録完了 → 2026-09-03）

- エンドポイント: `openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701`
- `RAKUTEN_ACCESS_KEY` / `RAKUTEN_ORIGIN` 追加
- モバイル直叩き不可の話は「端末→楽天」。oshi は API サーバー経由

## 2026-09-02: 登録 Vision 1回＋バーコード優先マージ

- 写真あり → `POST /assist/vision/describe` のみ（見た目タグ 12〜16・種類・色を structured_data）
- 優先: 手入力 > バーコード名/価格 > Vision。`/assist/tags/extract` は登録本線外
- 確認画面: カテゴリ/収納ピッカー、見た目タグチップ、続けて登録
- テスト: `apps/api/tests/test_vision_structured.py`、`applyAssistToDraft.test.ts`（node --test）

## 2026-09-02: タグ並び替え・プリセット非表示・アイコン本番表示

- **並び替え**: 設定一覧は ↑↓（モバイル向け）。`PUT /category-tags/order` / `PUT /storage-locations/order`
- **プリセット非表示**: slot 1–6 削除時は `*_preset_slot_dismissed` に記録（再自動作成しない）。`POST .../restore-preset` で復帰
- **本番表示**: ギャラリー一覧・詳細ヘッダに `ProductTagChip`。詳細編集は `TagChipPicker`（select 廃止）
- migration: `20260902160000_wire_preset_slot_dismissed_grants.sql`（Supabase 適用済み）

## 2026-09-02: Lucide アイコン移行（タグ・収納）

- `bi-*`（Bootstrap Icons）廃止 → Lucide slug（kebab-case）を DB/API に保存
- 正本: `docs/design/meta/lucide_icon_picker.json`（カテゴリ 70+ / 収納 30）
- 全ユーザー: migration で slot 1..6 を Lucide デフォルトにリセット。**slot 外・未設定の追加タグ／収納は削除**（製品参照は NULL）
- UI: `IconPickerGrid` + `--motion-playful`（短い scale・reduced-motion 対応）
- 生成: `python scripts/sync_lucide_icon_catalog.py`

## 2026-09-01: 色設定 Lab B を本番採用＋ダーク可読性

- `/settings/theme` ← Lab **B**（大きめ丸・写真帯・「自分の色にする」）
- スウォッチ枠: **黒＝ライト / 白＝ダーク**
- Lab の `text-zinc-900` 継承でダーク時に文字が黒くなる問題を修正（`[data-lab-theme-mock]` + パック fg）
- カタログ: `apps/web/src/lib/themes/catalog.ts`

## 2026-09-01: Design Lab に色設定（theme）3案

- `/dev/design-lab` 画面切替「色設定」: A 密スウォッチ / B 大きめ丸+写真帯 / C ラベル付きリスト
- タップで背景・文字・カード・ボタンが一式変わる見本（todo-app 方式）
- 本番 `/settings/theme` への採用は人の本決定後

## 2026-09-01: テーマ docs／rules／skills を todo-app 方式に統一

- 「primary/ring だけ」「シェル全面塗替え禁止」を誤りとして訂正
- 更新: `design.mdc` / `design-lab` / `design-change` / `design-mobile` / `README` / `principles` / `compare-workflow` / `components` / `brand-palette` / `a11y` / `motion` / `tokens`
- 正: テーマ＝セマンティック変数一式。既定緑 `default`。hex 直書き禁止

## 2026-09-01: テーマは todo-app 方式（フル・トークン）／緑 default

- 正: `colors.css` の `data-theme` でセマンティック変数一式を切替（[todo-app](https://github.com/neko-rr/todo-app)）
- 「primary/ring だけ」の docs 記述は誤り → `docs/design/themes.md` / `oshi-accents.md` を訂正
- 既定: 緑系 `default`。仮ユーザーの `quartz`/`morph` 等は `theme_settings` を `default` にリセット
- Dash/Bootswatch テーマ名は使わない

## 2026-09-01: 設定まわり移行（スコープ C）

- タグ／収納: カテゴリ・収納に編集 UI（PATCH）。API pytest 追加
- `theme_settings` を wired（authenticated GRANT + RLS）。DEFAULT=`default`（緑系）
- API: `GET/PUT /theme-settings`（allowlist）。Web: `/settings/theme`、Header から ThemePicker 撤去
- 設定ハブ: 見た目／タグ・収納／アカウント（/me・パスワード）／法務。退会は deferred
- 推し色スウォッチ・ブランド種スケールは後続（Design Lab）

## 2026-09-01: Wave 5 認証 DoD 締め

- ヘッダーにログイン／ログアウト、`LogoutButton` 日本語化
- `/me` は members_id / email のみ表示（JWT 非表示）
- acceptance/auth.md をクローズ（`auth_session` は shipped 維持）

## 2026-09-01: Wave 4 製品詳細の基本項目編集

- `ProductDetailEditor` で名前・メモ・価格・バーコード等を PATCH
- `purchase_price: null` で価格クリア可能
- `product_detail` → shipped

## 2026-09-01: カメラ読取 + 購入済み判定の土台

- Web: `BarcodeScanner`（BarcodeDetector → ZXing）、写真は `capture=environment`
- API: `GET /products?barcode=` 完全一致（`findOwnedByBarcode` 再利用前提）
- 登録ウィザードで同番号ヒント表示。店頭専用画面は未実装

## 2026-09-01: Must 移行継続（Wave 0–3）

- 認証ゲート: Supabase 未設定時は保護ルートを通さない（`AUTH_GATE_BYPASS=1` かつ非本番のみ例外）
- `/privacy` 公開、`/dev/*` は本番リダイレクト
- 登録ウィザード 1→2→6（楽天 LIVE なし・soft fail）
- 検索: `GET /products?q=` + `/search` / ギャラリー内検索
- 楽天 LIVE 連携は引き続きオフ前提

## 2026-08-31: Lab セーフエリア線は未実装（後回し）

- fb-001 / status=`deferred`
- Design Lab にノッチ・ホームバー用ガイドラインを出す件。Expo 画面が本番に近くなってから
- メモ: `docs/design/feedback/inbox.md` / `meta/feedback_items.json` / `design-lab` skill

## 2026-08-31: デザイン仕組み 5–7（tokens / gaps / mobile）

- tokens: `meta/tokens.json` + `check_design_tokens.py`（名前整合のみ。値生成なし）
- gaps: `generate_design_docs.py` → `docs/design/generated/gaps.md` 等
- mobile: skill **`design-mobile`** + icons を `lucide-react-native` へも sync
- pnpm: `check:design-tokens` / `generate:design-docs`

## 2026-08-31: デザイン Phase A（adoption / a11y / compliance）

- skill **`design-adoption`**: Lab → 本番を画面単位。`meta/design_adoption.json`
- skill **`design-a11y`**: WCAG 2.2 等を **WebFetch**（`a11y.md` は要約のみ。索引は `official-links.md`）
- 検査: `scripts/check_design_compliance.py`（hex / lucide 直 / 生 button）→ pre-commit `--check-staged`
- pnpm: `pnpm check:design`

## 2026-08-31: デザイン icons 自動同期

- 正本: `docs/design/meta/icons.json`（エージェント・承認後）
- 同期: `python scripts/sync_design_icons.py` → `apps/web/src/lib/icons.ts` + `icons.md` 採用表
- 検査: `--check` / pre-commit `--check-staged`
- pnpm: `pnpm sync:design-icons` / `pnpm check:design-icons`

## 2026-08-31: デザインフィードバックループ

- 要望・違和感: `docs/design/feedback/`（inbox 走り書き → pending → 採用）
- 構造化: `docs/design/meta/feedback_items.json`（**エージェント**、accepted は人の明示後のみ）
- アイコン正本: `docs/design/icons.md`（lucide / ISC）
- skill: **`design-feedback`** → 比較 **`design-lab`** / 本番 **`design-change`**
- 入口更新: ルート `DESIGN.md`（3層: UI/UX → 色 → 蓄積）

## 2026-08-30: デザイン体制（フェーズ0）

- 正本: `docs/design/`（原則・推し色・動き・3案比較）。薄い入口: ルート `DESIGN.md`
- 雰囲気は **UI/UX・動き**。色は顧客が選ぶ **推し色**（多数・スウォッチ）。カラータグとは別（枠はそのまま）
- 部品: shadcn/ui。ブランド種 `#9f606c` は文書化のみ（スケール詳細は後回し）
- 命令: `.cursor/rules/design.mdc` / skill **`design-change`** / 比較は **`design-lab`** / 要望は **`design-feedback`**
- Design Lab: **実装3案**（配置・部品が主差。A も C 同系色＋推し色）＋端末切替（Web PC / Web モバイル / アプリ）＋スコアの AI推奨
- Lab URL: `/dev/design-lab`（本番は 404）。付帯: 状態切替・推し色・色覚・**親指／文字／環境光**・仮採用メモ・コントラスト・QR・PC拡大
- 未実装寄り: 本番画面への採用反映・本番推し色スウォッチ UI

## 2026-08-30: マシン絶対パス禁止

- 共同開発・GitHub 公開前提のため、各 OS のユーザーホーム配下の絶対パスや `file:///` 付きホーム URI をリポジトリに書かない
- ガード: `scripts/secret_guard.py`（pre-commit）+ `naming.mdc` / `security.mdc` / `AGENTS.md`
- 既存の profile スクリプトは実行時に `Path.as_uri()` で組み立て。ARCHIVE plans も相対化済み

## 2026-08-30: env 契約表

- 正本: `docs/deploy/env-contract.md`（キー名のみ・実値禁止）
- 入口: `docs/deploy/README.md` / `WAKE_UP.md` / `deploy.mdc` / README・AGENTS・CONTRIBUTING
- GitHub 公開前チェックリストは同ファイル内。秘密ガードは `.githooks` + `secret_guard`（PII 全検知ではない）

## 2026-08-30: 製品仕様の仕組み（Spec Kit なし）+ 強化

- 正本: `docs/product/`（value / roadmap / flows / **acceptance** / meta）
- 語彙: `docs/product/meta/status_vocabulary.md`（shipped≠入口だけ）
- 生成: `python scripts/generate_product_docs.py`
  - Web/API/shared/services + **`openapi.asbuilt.json`** + **強化 gaps**（expected paths / deferred 勝手実装）
- skill: `product-spec-sync`（必須）。ルート変更時は `post-change-verify` でも再生成
- 規則: `.cursor/rules/spec.mdc` → `docs/product/`
- Spec Kit は使わない。**デザイン体制は `docs/design/` + skill `design-change` + `design-feedback`**（フェーズ0済み）

## 2026-08-30: Dash 固有ドキュメントは ARCHIVE のみ（現行ではない）

- **現行スタックは Next.js + FastAPI + Supabase**（`AGENTS.md` / `apps/web` / `apps/api`）
- 旧 Dash 用 `file_structure.md` / `spec.md` / `database_configuration.md` を「当面維持・正本」とする記述は **無効**
- 残してよい Dash 記述は次だけ:
  - `.cursor/rules/reference/file_structure-dash.md`（ARCHIVE バナー付き・新規設計に使わない）
  - `docs/archive/`・`.cursor/plans/archive/`（履歴）
  - glossary / migration 文書の「旧名 ↔ 正」対照
- 製品: `docs/product/`。DB: `docs/db/`。配置: `docs/migration/v2/rules/file_structure.md` + `architecture.mdc` / `platform.mdc`

## 2026-08-29: DB 資料 1〜6 + 自動生成

- `scripts/generate_db_docs.py` → `docs/db/generated/`（表・列・**schema_guide 日本語読み下し**・ER・baseline・GRANT）
- 列の日本語は手メンテしない。`term_glossary.json` + 生成。読む正本は `docs/db/generated/schema_guide.md`
- 手メンテ: wire-checklist / storage / backup-restore / constraints-notes / er-overview / meta/table_labels.json
- スキーマ変更後は必ず生成スクリプト（skill `db-schema-change`）

## 2026-08-29: 漏洩パスワード保護は Pro 必須

- Dashboard で確認: **無料枠では ON 不可**（Pro 以上）
- 対応: **アプリ一般公開時に検討**（有料プランとセット）
- メモ場所: `docs/db/security.md` / `docs/WAKE_UP.md`（**秘密ではないので Git 可**）

## 2026-08-29: DB セキュリティ hardening（A〜C）

- 文書: `docs/db/security.md` / `new-table-template.sql` / 公式索引に DB・Product security 追加
- ライブ: anon 全剥奪。schema_ready は authenticated も不可。wired 6 表のみ CRUD
- 将来表: default privileges を opt-in（自動 GRANT しない）
- `handle_new_user` の RPC EXECUTE を anon/authenticated から剥奪
- **人手**: Dashboard で漏洩パスワード保護を有効化（Auth → Password）
- skill: `db-schema-change` / `official-docs-first` に DB・Advisor を組み込み

## 2026-08-29: DB 仕組み化（rules + skill）

- 旧 `.cursor/rules/reference/database_configuration.md` は **削除**（ポインタのみで無意味だった）
- 入口: `docs/db/README.md` / `.cursor/rules/database.mdc` / skill **`db-schema-change`**
- 正本: `supabase/migrations/` + `docs/db/schema-catalog.md`（日本語名は維持）

## 2026-08-29: DB 案α改名（命名体制）

- 正本: `supabase/migrations/` + `docs/db/`（日本語名付きカタログは維持）
- 主な改名: `receipt_location`→`storage_location`、`registration_product_information`→`registered_product` 等
- API: `/storage-locations`、JSON `registered_product_id` / `storage_location_id`
- Web: `/settings/storage-locations`、`/gallery/[registered_product_id]`

## 2026-08-29: plans を archive へ選別

- 基準: 未完了 v2 のみ直下。完了・Dash・旧パスは `.cursor/plans/archive/`
- 直下は README のみ（アクティブ plan なし）
- エージェントは archive を新規実装の正にしない

## 2026-08-29: 共同作業向け体制の穴埋め

- API JWT 検証を **JWKS のみ**にコード整合（`auth.py`）。Legacy Secret は無視
- README / WAKE_UP / CONTRIBUTING / `.env.example` を JWKS・venv 前提に更新
- `apps/api/run-venv.mjs` で Win/macOS/Linux の `pnpm dev:api` / test
- `reference/*` に ARCHIVE バナー（Dash Always Apply 誤読防止）
- 主要ドキュメントの `.md` → `.mdc` リンク修正

## 2026-08-29: rules を Cursor 正式形式（.mdc）へ

- `.cursor/rules/*.mdc` + YAML（`alwaysApply` / `globs` / `description`）
- 本文はエージェント命令形。長い表は `reference/` と `docs/migration/v2/rules/`
- 旧手書き `.md` ルール（トップレベル）は削除

## 2026-08-29: 用途別ルール + 公式優先スキル

- 方針: 用途で固める（auth / security / platform / deploy / mobile）
- 索引: `docs/refs/official-links.md`（正本ではない）
- Skills: `official-docs-first` / `secure-change-checklist`
- Auth 正本を JWKS（非対称）前提に更新。Legacy JWT Secret は新規依存にしない
- 入口: `AGENTS.md` / `.cursor/rules/architecture.md` / `.cursor/rules/README.md`

## 2026-08-29: gallery/dashboard 500（supabase ClientOptions）

- 症状: `/me` は成功、`GET /products` 等で API 500
- 原因: `ClientOptions` に `storage` が無く supabase 2.31 で AttributeError
- 対応: `SyncClientOptions` に変更（`apps/api/app/infra/supabase_user.py`）

## 2026-08-20: IO モデルフォールバック実装

- 主モデル失敗（HTTP 4xx/5xx・例外）時のみ `IO_INTELLIGENCE_FALLBACK_MODEL` を試す
- Vision / タグ抽出の両方。共通: `app/services/io_chat_client.py`
- テスト: `apps/api/tests/test_io_fallback.py`（httpx モック）
- `.env` に FALLBACK 行が二重だと後勝ちになるので1行にすること

## 2026-08-12: Dash 全機能移管（一括）

- API: products CRUD、tags（color / category / **storage_location** ※旧 receipt）、stats、dashboard charts、assist HTTP（LIVE 既定オフ）
- Web: ホーム統計、ダッシュボード、設定ハブ＋タグ編集、詳細編集、登録フォーム拡張、ナビ更新
- 後回し: 書籍/SNS、規約、theme_settings 表、全削除、カメラ本格ウィザード
- 検証: `apps/api/.venv` で pytest OK、shared build / web lint / tsc OK
- 注意: ルートの素の `python -m pytest` は multipart 未導入で落ちる → **必ず `apps/api/.venv` を使う**

## 2026-08-12: gallery 詳細 + signed URL

- `GET /products/{id}`、Web `/gallery/[id]`
- 一覧サムネ signed URL

## 2026-08-12: gallery signed URL

- `GET /products` に `photo_thumbnail_url`（Storage sign、失敗時 null）
- Web ギャラリーで `<img>` 表示

## 2026-08-12: IO/楽天は設計のみ

- `/assist/*` + services（credential / LIVE ゲート）
- 実 HTTP・呼び出しテストはキー更新後
- 文書: `docs/migration/v2/assist_external_apis.md`

## 2026-08-12: register 簡易スライス

- `POST /products` / `POST /photos`（IO Vision・楽天は呼ばない）
- Web `/register` 仮フォーム
- 次: signed URL、タグ／詳細、本格ウィザード

## 2026-08-12: products 一覧スライス

- `GET /products`: ユーザー JWT + `SUPABASE_PUBLISHABLE_KEY` で RLS 照会
- Web `/gallery` が API 接続（仮カード UI）
- 次: register 移植 → 画像 signed URL

## 2026-08-12: Supabase 公式名寄せ + Library UI + テーマ

- Web 公開キーは `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`（旧 `…_DEFAULT_KEY` 廃止）
- API は `SUPABASE_URL` / `SUPABASE_JWKS_URL` /（任意）publishable・secret。`SUPABASE_JWT_SECRET` と `CORS_ORIGINS` は未設定でも可（JWKS・localhost 既定）
- Skills: `.agents/skills/supabase` と `supabase-postgres-best-practices`
- UI: `npx shadcn add @supabase/password-based-auth-nextjs` 系。テーマ色は todo-app の `colors.css` / `ThemePicker`
- Library 参照方針: `.cursor/rules/supabase-library.md`（[Realtime Cursor](https://supabase.com/library/docs/nextjs/realtime-cursor) は共同編集時の参考。現状機能では未導入）
- `.env.local` にパスワードをコメントで書かない（漏えいリスク）

## 2026-08-12: Next.js + FastAPI 移行 Phase 0（A）

### 方針確定

- **新規 monorepo** で Next + FastAPI に移行する（サービス未開始のため既存 Supabase / 現行インフラ方針は継続利用）。
- **認証の発行体は todo-app と同じ Supabase Auth**。
- **Web**: `@supabase/ssr` + Cookie + middleware（todo-app 準拠）。
- **API**: FastAPI は **Bearer JWT**。Dash 期の Flask PKCE + 入口 Cookie ガードは**採用しない**。
- **RLS / `members_id`** は従来どおり最終防衛。
- モバイル（Expo）は後期。同じ Auth + 同じ API を前提に `apps/mobile` 枠のみ。

### 文書の置き場

- 計画: `.cursor/plans/next-fastapi-phase0-monorepo.md`
- 新リポ用ドラフト: `docs/migration/v2/`（AGENTS / rules / skill）
- **認証の正本**: `.cursor/rules/auth.mdc`（= `docs/migration/v2/rules/auth.md` と同系）
- **旧 OAuth（Flask+Dash）**: `docs/archive/oauth-dash-flask.md`（DEPRECATED）。`.cursor/rules/OAuth.md` は削除済み
- ~~現行 Dash 用 `file_structure.md` / `spec.md` / `database_configuration.md` は当面維持~~ → **2026-08-30 破棄**。正本は `docs/product/`・`docs/db/`・`.cursor/rules/*.mdc`。Dash 構成は `reference/file_structure-dash.md`（ARCHIVE）のみ

### 次アクション（要承認: Phase 1）

- ~~新規 GitHub リポジトリ作成 or ローカル monorepo 初期化~~ → **実施済み**（本リポが monorepo）
- ~~`apps/web` + `apps/api` 骨格~~ → **実施済み**。以降は機能移管・品質向上

## 2026-08-12: 秘密情報ハーネス（private Git 用）

### 入れたもの

| 層 | パス |
|----|------|
| ignore | `.gitignore`（`.env` / 鍵 / credentials 等）、`.cursorignore` |
| rule | `.cursor/rules/security.md` |
| 共有検査 | `scripts/secret_guard.py` |
| Git hook | `.githooks/pre-commit` + `core.hooksPath=.githooks`（ローカル） |
| Cursor hooks | `.cursor/hooks.json`（危険な `git add .env` / `.env` 書き込み / `--no-verify` を deny） |

### 運用

- **実 `.env` はコミットしない**（gitignore 済み。`git add .env` は ignore）。
- private GitHub も **実キーは載せず**、Render/Supabase ダッシュボードにのみ置く。
- 初回クローン後: `git config core.hooksPath .githooks`
- Cursor の Hooks が効かない場合は Settings → Hooks を確認し、必要ならウィンドウ再読み込み。

### 未実施

- リモート（GitHub private）の作成・push はユーザー承認後。

## 2026-08-12: OAuth.md の棚卸し（仕様移行）

- **正本**: `.cursor/rules/auth.mdc`（Next + FastAPI + Supabase Auth）
- **アーカイブ**: `docs/archive/oauth-dash-flask.md`（旧 Flask PKCE。冒頭 DEPRECATED）
- **削除**: `.cursor/rules/OAuth.md`（rules に旧仕様を残さない）
- Google Provider / Supabase callback URI など共通知識は `auth.mdc` に取り込み
- **skills への降格はしない**（仕様≠手順）

## 2026-08-12: 命名規則ハーネス

| 層 | パス | 役割 |
|----|------|------|
| rule | `.cursor/rules/naming.mdc` | 字形・置き場・禁止・JSON snake_case |
| 用語集 | `docs/migration/v2/glossary.md` | 旧なりゆき → 正（product/photo 等） |
| skill | `.cursor/skills/new-file-naming/` | 新規作成時チェックリスト |
| CLI | `scripts/naming_check.py` | 禁止名を pre-commit でも検査 |
| 入口 | `AGENTS.md` + `.cursor/rules/architecture.mdc` | 旧 rules との優先順位 |

方針: **新規コードは 100% 遵守**。旧 Dash / 既存 DB 物理名は一括リネームしない（必要なときだけ migration）。  
（旧 `file_structure.md` の Dash 正本扱いは終了。優先順位は `architecture.mdc`。Dash 構成は ARCHIVE 参照のみ。）

## 2026-08-12: TDD + Web プロファイル

### TDD

- rule: `.cursor/rules/tdd.mdc`
- skill: `.cursor/skills/tdd-workflow/`
- `apps/api` の pytest（ルートの素の python ではなく venv）
- `.vscode/settings.json` / `launch.json` で pytest を有効化

## 2026-08-12 夜間: monorepo 骨格実装

### 完了

- pnpm monorepo: `apps/web`, `apps/api`, `apps/mobile`, `packages/shared`
- FastAPI: `/health`, `/me`（Bearer）, `/products` プレースホルダ + pytest
- Next.js: 認証ルート、`/me` 縦スライス、@supabase/ssr
- AGENTS.md / README / .env.example
- TDD tests green（API）

### 起きてからユーザー作業

1. Supabase Dashboard: Redirect URLs（Next `/auth/confirm`）
2. `apps/web/.env.local` と `apps/api/.env` に実キー（Git 不可）
3. Render に `apps/api` Dockerfile デプロイ
4. Google OAuth が必要なら Provider 設定（auth.md）

### ローカル確認

```powershell
pnpm dev:api
pnpm dev:web
curl http://127.0.0.1:8000/health
```
