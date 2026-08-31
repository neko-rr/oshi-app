<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# データベース文書（エージェント・人間の入口）

**更新区分の凡例（全体）:** [docs/README.md](../README.md)  
DB を触るセッションは **まずここ**。続けて skill `db-schema-change`。

## ファイルマップ

| ファイル | 役割 | 更新 |
|----------|------|------|
| [security.md](security.md) | GRANT/RLS（初学者向け） | **手** |
| [naming.md](naming.md) | 物理名の法則 | **手** |
| [new-table-template.sql](new-table-template.sql) | 新規表テンプレ | **手** |
| [wire-checklist.md](wire-checklist.md) | schema_ready→wired | **手** |
| [storage.md](storage.md) | photos 運用 | **手** |
| [backup-restore.md](backup-restore.md) | バックアップ | **手** |
| [constraints-notes.md](constraints-notes.md) | スロット等の要点 | **手** |
| [er-overview.md](er-overview.md) | ER の読み方 | **手** |
| [schema-catalog.md](schema-catalog.md) | カタログ入口 | **手**（リンク中心） |
| [meta/](meta/README.md) | labels / glossary | **エージェント**（下表） |
| [generated/](generated/README.md) | 表・列・読み下し・ER・baseline | **自動** |
| `supabase/migrations/` | スキーマ変更の正本 | **migration** |

## 日本語で読む（あなた向け）

| 優先 | ファイル |
|------|----------|
| 1 | [generated/schema_guide.md](generated/schema_guide.md) … 表・列の意味を日本語で（**読むだけ**） |
| 2 | [generated/columns.md](generated/columns.md) … 日本語列名＋型（**読むだけ**） |
| 3 | [generated/tables.md](generated/tables.md) … 表一覧（**読むだけ**） |

列の日本語は **手動メンテしない**。`generate_db_docs.py` が `term_glossary.json` から毎回合成する。
未知トークンは [generated/unknown_terms.md](generated/unknown_terms.md) → エージェントが glossary を足して再生成。

## 自動更新（恒常資料）

スキーマを変えたら **必ず**:

```powershell
python scripts/generate_db_docs.py --snapshot docs/db/generated/schema_snapshot.json
# または DATABASE_URL をセットして python scripts/generate_db_docs.py
```

エージェントは MCP で snapshot を取り直してから上記を実行する（skill `db-schema-change`）。

## 接続状態

| ラベル | Data API |
|--------|----------|
| `wired` | authenticated 最小 + RLS |
| `schema_ready` | 権限なし（精査後に [wire-checklist.md](wire-checklist.md)） |
| `storage` | Private バケット |

## やらないこと

- `generated/` を手編集する
- 日本語名を `table_labels.json` から消す
- 列の日本語を手で列挙してメンテする（合成に任せる）
- 未精査表を広く GRANT する
