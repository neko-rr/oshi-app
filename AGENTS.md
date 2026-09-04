# AGENTS.md（エージェント入口）

詳細は **用途別** `.cursor/rules/*.mdc`（YAML frontmatter 付き）に委譲する。  
公式 URL 索引: `docs/refs/official-links.md`（正本ではない）。

## プロダクト

推し活グッズ管理アプリ。バーコード・写真から登録し、収納タグで実物とデータをつなぐ。

**v2 移行（2026-09）:** Must 本線はほぼ完了。正本は [docs/product/v2_status.md](docs/product/v2_status.md) / [roadmap.md](docs/product/roadmap.md)。  
Phase 2・モバイル本番・deferred は要求に応じて。ARCHIVE / Dash を新規設計の正にしない。

## スタック（v2）

| 層 | 技術 | 配置 |
|----|------|------|
| Web | Next.js App Router | `apps/web` |
| API | FastAPI | `apps/api` |
| Auth/DB/Storage | Supabase | 既存プロジェクト |
| Mobile（後） | Expo | `apps/mobile` |
| Deploy 想定 | Render（API）+ Cloudflare（Web） | — |

## 絶対ルール

1. 秘密をログ・チャット・コミットに出さない（`security.mdc`）
2. **マシン絶対パス禁止**（リポジトリ相対のみ。`naming.mdc` / `secret_guard`）
3. 認証発行は Supabase Auth のみ。API は **JWKS**（`auth.mdc`）
4. `members_id` = JWT `sub` + RLS
5. UI とドメインを混ぜない（業務は `apps/api` `services/`）
6. クライアントに secret / service_role / JWT 秘密を入れない
7. 命名は `naming.mdc` / glossary
8. 振る舞い変更は TDD（`tdd.mdc`）
9. `core.hooksPath=.githooks`、`--no-verify` 禁止
10. コメントは日本語
11. Auth/セキュリティ/デプロイ変更前は skill `official-docs-first`

## ルールの頻度（Cursor）

| ファイル | 頻度 |
|----------|------|
| `architecture` `security` `auth` `platform` `naming` `tdd` | **alwaysApply: true** |
| `api_contract` | globs: `apps/api/**/*`, `packages/shared/**/*` |
| `database` | globs: `apps/api/**/*`, `supabase/**/*.sql`（詳細は `docs/db/`） |
| `supabase-library` | globs: `apps/web/**/*` |
| `mobile` | globs: `apps/mobile/**/*` |
| `deploy` `spec` | alwaysApply: false（エージェントが description で参照） |
| `design` | globs: `apps/web/**` / `docs/design/**` |

長い参照: `.cursor/rules/reference/`（ARCHIVE 多め）。**DB 現行は `docs/db/`**。**製品仕様は `docs/product/`**。**デザインは `docs/design/`**。  
**docs の手/自動/エージェントの見分け:** [docs/README.md](docs/README.md)

## Skills

| いつ | Skill |
|------|--------|
| Auth・JWT・デプロイ・mobile 着手前 | `official-docs-first` |
| **DB・migration・RLS・docs/db** | **`db-schema-change`** |
| **Render / Cloudflare / 本番 env・CORS** | **`deploy-change`** |
| **製品仕様・画面/API ルート・flows / acceptance** | **`product-spec-sync`** |
| **shared API_PATHS ↔ FastAPI ルート** | **`api-contract-sync`** |
| **Web messages ja→en 下書き・キー欠落** | **`i18n-web-sync`** |
| **Web UI・トークン・推し色・docs/design** | **`design-change`** |
| **Design Lab・3案スコア・本決定前比較** | **`design-lab`** |
| **Lab 案の本番画面単位採用** | **`design-adoption`** |
| **デザイン要望・pending・inbox 反映** | **`design-feedback`** |
| **a11y・コントラスト（公式 WebFetch）** | **`design-a11y`** |
| **Expo / モバイルデザイン契約** | **`design-mobile`** |
| 認証・公開面変更後 | `secure-change-checklist` |
| 実装前 | `tdd-workflow` |
| 変更後検証 | `post-change-verify` |
| 新規命名 | `new-file-naming` |
| Supabase | `.agents/skills/supabase` |
| Postgres/RLS | `.agents/skills/supabase-postgres-best-practices` |

### Skill → Task / サブエージェント（委譲）

カスタムサブエージェント定義は **増やさない**。重い・機械的な作業だけ Cursor の **Task**（`shell` / `explore` / `generalPurpose`）や組み込みレビューに委譲する。  
**仕様・TDD・認可・採用判断は親エージェントが持つ。** 委譲先は合否と要点だけ返す（生ログ全文は貼らない）。security / bugbot の自作は禁止（組み込みを使う）。

| Skill / 作業 | 委譲 | 備考 |
|--------------|------|------|
| `post-change-verify` | **可 → Task(shell)** | 長い検証ログを親から隔離 |
| `design-a11y`（公式 WebFetch） | **可 → Task(generalPurpose / explore)** | 取得・要約のみ。採用判断は親 |
| docs/db・product 横断調査 | **可 → Task(explore)** | 読み取り調査 |
| PR 前のセキュリティ／差分レビュー | **可 → 組み込み `security-review` / `bugbot`** | 重複 skill を作るな |
| `tdd-workflow` | **不可** | Red→実装の本体は親 |
| `official-docs-first` | **判断は親** | Fetch だけ Task 可。結論は親 |
| `secure-change-checklist` | **不可** | 親の diff・変更意図が必要 |
| `new-file-naming` | **不可** | 1ファイル前の短い確認 |

DB の人間向け入口: [docs/db/README.md](docs/db/README.md)  
表・列の日本語説明（自動生成）: [docs/db/generated/schema_guide.md](docs/db/generated/schema_guide.md)  
製品（顧客価値・ロードマップ・as-built）: [docs/product/README.md](docs/product/README.md)  
デザイン（原則・推し色・動き）: [docs/design/README.md](docs/design/README.md)（薄い入口: [DESIGN.md](DESIGN.md)）  
**文書の更新区分（手 / 自動）:** [docs/README.md](docs/README.md)

## 品質・共同作業

- 業務エラー → ユーザー向けメッセージ + HTTP ステータス
- システムエラー → ログして上位へ（秘密はマスク）
- 変更後: `post-change-verify` +（該当時）`secure-change-checklist`
- ローカル検証 ↔ CI の対応表: skill **`post-change-verify`**（「ローカル ↔ CI 対応」）
- 人向け手順: [CONTRIBUTING.md](CONTRIBUTING.md) / [README.md](README.md) / [docs/WAKE_UP.md](docs/WAKE_UP.md)  
  env 契約（キー名のみ）: [docs/deploy/env-contract.md](docs/deploy/env-contract.md)
