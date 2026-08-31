<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# meta（製品ステータス）

**凡例:** [docs/README.md](../../README.md)

| ファイル | 役割 | 更新 |
|----------|------|------|
| [status_vocabulary.md](status_vocabulary.md) | ステータス語彙の定義 | **手** |
| [feature_status.json](feature_status.json) | 機能 ID → status / evidence / expected | **エージェント**（承認後・JSON は先頭コメント不可） |

## エージェント向け

- status を変えるときは [status_vocabulary.md](status_vocabulary.md) に従う
- `shipped` ≠ 「ファイルが1つある」
- 変更後は必ず `python scripts/generate_product_docs.py` → `generated/gaps.md`
- skill: `product-spec-sync`
