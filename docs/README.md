<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# docs/（文書の入口・更新区分）

**迷ったらこのページだけ見る。**  
人が直してよいのは「更新: **手**」だけ。`generated/` は触らない。

各ファイル先頭の `<!-- 更新: … -->`（SQL は `-- 更新: …`）も同じ意味。

## 凡例

| 印 | 意味 | あなたがやること |
|----|------|------------------|
| **手** | 人が書いて直す正本 | 編集してよい |
| **エージェント** | AI が更新（承認後）。人は原則触らない | 読む／承認する |
| **自動** | スクリプト生成 | **手編集禁止** |
| **ARCHIVE** | 履歴 | 新規設計の正にしない |
| **ARCHIVE寄り** | 移行メモ | 食い違うときはルート `AGENTS.md` / `.mdc` 優先 |
| **migration** | SQL マイグレーション | `supabase/migrations/` の手続 |

### フォルダ規則（最短）

| パス | 更新 |
|------|------|
| `**/generated/` | **自動** |
| `**/meta/*.json` | **エージェント** |
| `db/`・`product/` の説明 md、`flows/`、`acceptance/` | **手** |
| `archive/` | **ARCHIVE** |
| `migration/v2/` | **ARCHIVE寄り** |
| `design/` | **手**（UI 正本。薄い入口はルート `DESIGN.md`）。`meta/icons.json` はエージェント → sync |

---

## 全体マップ

| 場所 | 役割 | 入口 |
|------|------|------|
| [db/](db/README.md) | DB・RLS・カタログ | [db/README.md](db/README.md) |
| [product/](product/README.md) | 製品価値・ロードマップ・as-built | [product/README.md](product/README.md) |
| [design/](design/README.md) | UI/UX・推し色・動き・トークン方針 | [design/README.md](design/README.md) |
| [WAKE_UP.md](WAKE_UP.md) | クラウドで人がやる ToDo | **手** |
| [deploy/](deploy/README.md) | env 契約・デプロイ（キー名のみ） | **手** |
| [refs/official-links.md](refs/official-links.md) | 公式 URL 索引（正本ではない） | **手** |
| [archive/](archive/README.md) | 旧 Dash 等 | **ARCHIVE** |
| [migration/v2/](migration/v2/AGENTS.md) | 移行ドラフト | **ARCHIVE寄り** |

関連（docs 外）: `supabase/migrations/` → **migration**

---

## 点検結果：ファイルごとの更新区分（2026-08-30）

### 手（人が直す）

| パス |
|------|
| `README.md`（このページ） |
| `WAKE_UP.md` |
| `deploy/README.md` / `deploy/env-contract.md` |
| `refs/official-links.md` |
| `db/README.md` / `db/security.md` / `db/naming.md` / `db/wire-checklist.md` |
| `db/storage.md` / `db/backup-restore.md` / `db/constraints-notes.md` |
| `db/er-overview.md` / `db/schema-catalog.md` / `db/new-table-template.sql` |
| `db/meta/README.md` |
| `product/README.md` / `product/value.md` / `product/roadmap.md` |
| `product/flows/register.md` |
| `product/acceptance/**`（各 DoD と README） |
| `product/meta/README.md` / `product/meta/status_vocabulary.md` |
| `design/README.md` / `design/principles.md` / `design/tokens.md` |
| `design/brand-palette.md` / `design/components.md` / `design/themes.md` |
| `design/oshi-accents.md` / `design/motion.md` / `design/compare-workflow.md` |
| `design/a11y.md` / `design/feedback/**` / `design/icons.md` / `design/meta/README.md` |
| ルート `DESIGN.md`（薄い入口） |

### エージェント（人は原則触らない）

| パス | 備考 |
|------|------|
| `db/meta/table_labels.json` | wired 状態など |
| `db/meta/term_glossary.json` | **人間は触らない**（列日本語の合成用） |
| `product/meta/feature_status.json` | 承認後にエージェント更新 |
| `design/meta/feedback_items.json` | デザイン要望（pending / accepted 等） |
| `design/meta/icons.json` | 採用 lucide 正本（承認後にエージェント更新） |
| `design/meta/tokens.json` | セマンティック・トークン名（check のみ） |
| `design/meta/design_adoption.json` | Lab 案の本番採用状態 |

### 自動（手編集禁止）

| パス | 再生成 |
|------|--------|
| `db/generated/**`（README 以外の中身） | `python scripts/generate_db_docs.py` |
| `product/generated/**`（README 以外の中身） | `python scripts/generate_product_docs.py` |
| `design/generated/**`（README 以外の中身） | `python scripts/generate_design_docs.py` |
| `apps/web/src/lib/icons.ts` | `python scripts/sync_design_icons.py` |
| `apps/mobile/src/lib/icons.ts` | 同上 |
| `design/icons.md`（AUTO マーカー内の採用表） | 同上 |

検査（自動ではないが CI/pre-commit）: `python scripts/check_design_compliance.py` / `python scripts/check_design_tokens.py`

`db/generated/README.md` と `product/generated/README.md` は「自動フォルダの説明」で **手**（説明文だけ直してよい）。中の生成物は直さない。

### ARCHIVE / ARCHIVE寄り

| パス |
|------|
| `archive/README.md` / `archive/oauth-dash-flask.md` |
| `migration/v2/**`（現行正本ではない） |

---

## 実務ルール（あなた向け）

1. 直すなら上表の **手** だけ  
2. `generated/` は **読むだけ**  
3. `meta/*.json` はエージェント／承認後  
4. `archive` と `migration/v2` は歴史・対照用  

## 読む順

1. このページ  
2. 製品 → [product/value.md](product/value.md)  
3. デザイン → [design/README.md](design/README.md)  
4. DB → [db/generated/schema_guide.md](db/generated/schema_guide.md)（読むだけ）  
5. クラウド → [WAKE_UP.md](WAKE_UP.md)  
