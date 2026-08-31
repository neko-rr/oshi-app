<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# meta（DB・エージェント用）

**凡例:** [docs/README.md](../../README.md)

| ファイル | 役割 | 更新 |
|----------|------|------|
| [table_labels.json](table_labels.json) | wired / schema_ready と表の日本語優先表示 | **エージェント** |
| [term_glossary.json](term_glossary.json) | 英語トークン→日本語（列名合成） | **エージェント**（人間は触らない） |

人間が日本語列名を直したいときは、この JSON を手で列挙せず、未知トークンを glossary に足して `generate_db_docs.py` を再実行する（エージェント手順）。
