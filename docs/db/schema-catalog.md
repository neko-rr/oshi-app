<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# スキーマカタログ（入口）

**正本:** ライブ DB + `supabase/migrations/`  
**自動更新:** `docs/db/generated/`（`python scripts/generate_db_docs.py`）  
**wired 状態:** `docs/db/meta/table_labels.json`  
**列・表の日本語表示:** `term_glossary.json` から自動合成（人間は触らない）

エージェント: [README.md](README.md) → skill `db-schema-change`

## すぐ見る

| 資料 | 内容 |
|------|------|
| [generated/schema_guide.md](generated/schema_guide.md) | **表・列の日本語読み下し（説明の正）** |
| [generated/tables.md](generated/tables.md) | 表一覧（日本語名付き・生成） |
| [generated/columns.md](generated/columns.md) | 全列 + 日本語列名（生成） |
| [generated/er-diagram.md](generated/er-diagram.md) | ER 図（生成・`Ctrl+Shift+V`） |
| [er-overview.md](er-overview.md) | ER の読み方 |
| [generated/constraints.md](generated/constraints.md) | CHECK/FK/INDEX（生成） |
| [constraints-notes.md](constraints-notes.md) | スロット等の要点（手） |
| [generated/grants_policies.md](generated/grants_policies.md) | GRANT/RLS（生成） |
| [generated/schema_baseline.sql](generated/schema_baseline.sql) | ドキュメント用 CREATE（生成） |
| [security.md](security.md) | 権限の考え方 |
| [wire-checklist.md](wire-checklist.md) | 連携手順 |
| [storage.md](storage.md) | 写真 Storage |
| [backup-restore.md](backup-restore.md) | バックアップ |

## セキュリティ（要約）

- **anon**: 権限なし
- **authenticated**: `wired` 表のみ CRUD（詳細は generated/grants_policies.md）
- **schema_ready**: GRANT なし
- 詳細: [security.md](security.md)

## 改名対応（案α・履歴）

| 日本語名 | 旧物理名 | 新物理名 |
|----------|----------|----------|
| 版権会社 | `copyright_source` | `copyright_company` |
| 製品サイズ | `product_regulations_size` | `product_size` |
| 作品情報 | `works_information` | `work`（PK `work_id`） |
| 会員情報 | `member_information` | `member` |
| 収納場所 | `receipt_location` | `storage_location` |
| 登録製品 | `registration_product_information` | `registered_product` |
| おまけ付きフラグ | `flag_with_freebie` | `freebie_flag` |
| 高解像度登録可能枚数 | `number_registerable_high_resolution` | `high_resolution_registerable_number` |

## 再生成コマンド

```powershell
# MCP 等で snapshot を更新したあと:
python scripts/generate_db_docs.py --snapshot docs/db/generated/schema_snapshot.json

# または DATABASE_URL / SUPABASE_DB_URL があるマシン:
python scripts/generate_db_docs.py
```
