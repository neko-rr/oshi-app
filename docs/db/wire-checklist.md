<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# schema_ready → wired 連携チェックリスト

未連携表をアプリから使う前に、この順で進める。  
詳細手順: skill `db-schema-change` / [security.md](security.md)

## 1. 精査

- [ ] 列・型・NULL・デフォルトが要件に合う（[generated/columns.md](generated/columns.md)）
- [ ] FK / CHECK を確認（[generated/constraints.md](generated/constraints.md)）
- [ ] 日本語名を `meta/table_labels.json` に登録済み（表の status / 必要なら ja）
- [ ] 新しい英語トークンがあれば `meta/term_glossary.json` に追加し `generate_db_docs.py` 済み
- [ ] ユーザー所有なら `members_id` がある／マスタなら読み取り方針を決めた

## 2. セキュリティ（migration）

- [ ] RLS ON（既定）
- [ ] ポリシー: ユーザー所有は `TO authenticated` + `members_id = auth.uid()`（USING と WITH CHECK）
- [ ] マスタは原則 `GRANT SELECT` のみ、またはサーバ経由のみ
- [ ] **`GRANT` を authenticated に明示**（自動 GRANT は無効化済み）
- [ ] anon には付けない

## 3. アプリ

- [ ] `apps/api` services / routers（JSON は snake_case）
- [ ] 必要なら `packages/shared`・Web
- [ ] TDD（`tdd-workflow`）

## 4. カタログ・生成物

- [ ] `meta/table_labels.json` の `status` を `wired` に変更
- [ ] `python scripts/generate_db_docs.py`（または `--snapshot`）で `generated/` 更新
- [ ] [schema-catalog.md](schema-catalog.md) の手書きメモがあれば更新
- [ ] MCP `get_advisors(security)`
- [ ] `post-change-verify`

## やらないこと

- 精査前に authenticated へ広く GRANT
- Dashboard だけの権限変更を正とする
- 日本語名をカタログから消す
