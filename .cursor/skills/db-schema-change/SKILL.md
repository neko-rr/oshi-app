---
name: db-schema-change
description: >-
  Postgres / Supabase のテーブル・列・RLS・GRANT・migration・カタログを触る前と後に適用する。
  スキーマ変更、改名、新規表、権限、ポリシー、docs/db 更新のとき必須。
---

# DB スキーマ変更（oshi_app）

## いつ使うか（必須）

- `CREATE` / `ALTER` / `DROP` / 改名・RLS・GRANT・インデックス
- `supabase/migrations/` / `docs/db/` の変更
- API が触るテーブル・列・JSON キーの変更
- Supabase MCP でライブ DB を変えるとき

## 正本マップ

| 何 | どこ |
|----|------|
| 変更 SQL | `supabase/migrations/` |
| 自動生成カタログ | `docs/db/generated/`（**手編集禁止**） |
| **日本語読み下し（説明の正）** | `docs/db/generated/schema_guide.md` |
| wired 状態 | `docs/db/meta/table_labels.json` |
| 用語→日本語（列合成） | `docs/db/meta/term_glossary.json`（**エージェント更新・人間は触らない**） |
| 入口 | `docs/db/README.md` / `schema-catalog.md` |
| **手/自動の見分け** | **`docs/README.md`**（`generated/`=自動、`meta/*.json`=エージェント） |
| セキュリティ | `docs/db/security.md` |
| 連携手順 | `docs/db/wire-checklist.md` |
| 新表 | `docs/db/new-table-template.sql` |
| 命令 | `.cursor/rules/database.mdc` |

## 着手前

1. 更新区分が曖昧なら `docs/README.md`（**手**だけ人が直す。`generated/` は触るな）
2. `docs/db/security.md` + `wire-checklist.md`（連携時）
3. GRANT/RLS なら `official-docs-first`
4. MCP `list_tables` で差分確認
5. 改名／DROP はユーザー承認
6. 振る舞い変更なら `tdd-workflow`

## 権限の原則

- anon に業務表を GRANT するな
- schema_ready は authenticated にも付けない
- wired だけ最小 GRANT + RLS（`members_id`）
- 新規表はテンプレ。自動 GRANT に頼るな

## 実行手順

1. migration を書いてライブ適用
2. コード追随（API / Web / shared）
3. `meta/table_labels.json` の `status`（必要なら表の `ja`）を更新
4. **ドキュメント再生成（必須）**
   - snapshot 更新: MCP で schema JSON を取り `docs/db/generated/schema_snapshot.json` に保存  
     または `DATABASE_URL` / `SUPABASE_DB_URL` をセット
   - `python scripts/generate_db_docs.py`（または `--snapshot ...`）
5. `generated/unknown_terms.md` にトークンがあれば `term_glossary.json` に追加して **再生成**（人間にメンテさせない）
6. ユーザーへの説明は `generated/schema_guide.md` を使う

## 完了後チェック

- [ ] migration がリポとライブにある
- [ ] `generate_db_docs.py` で `generated/` を更新した
- [ ] `unknown_terms.md` が空（または glossary 更新済み）
- [ ] `schema_guide.md` / `columns.md` に日本語列名がある
- [ ] 旧物理名の grep クリア
- [ ] `get_advisors(security)`
- [ ] `post-change-verify`（＋該当時 `secure-change-checklist`）
- [ ] 秘密を出していない

## schema_ready → wired

`docs/db/wire-checklist.md` を上から実行する。

## 関連

- `docs/db/storage.md` / `backup-restore.md` / `constraints-notes.md`
- `.agents/skills/supabase` / `supabase-postgres-best-practices`
