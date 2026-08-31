# 共同開発メモ（短い）

1. 入口: [AGENTS.md](AGENTS.md) → [.cursor/rules/README.md](.cursor/rules/README.md)
2. セットアップ・起動・テスト: [README.md](README.md)
3. **docs の手/自動の見分け:** [docs/README.md](docs/README.md)
4. クラウド作業: [docs/WAKE_UP.md](docs/WAKE_UP.md) / env 契約: [docs/deploy/env-contract.md](docs/deploy/env-contract.md)
5. **DB・スキーマ**: [docs/db/README.md](docs/db/README.md) → skill `db-schema-change`
6. **製品仕様**: [docs/product/README.md](docs/product/README.md) → skill `product-spec-sync`（DoD: `docs/product/acceptance/`）
7. **デザイン**: [docs/design/README.md](docs/design/README.md) → skill `design-change` / 比較 **`design-lab`** / 本番採用 **`design-adoption`** / 要望 **`design-feedback`** / a11y **`design-a11y`** / モバイル **`design-mobile`**（入口: [DESIGN.md](DESIGN.md)）
8. 秘密は各マシン / Dashboard のみ。`.env` をコミットしない
9. API は必ず `apps/api/.venv`（`pnpm dev:api` / `pnpm test:api`）
10. Auth 変更前: skill `official-docs-first`。**DB 変更前: skill `db-schema-change`**。製品フロー変更前: **`product-spec-sync`**。UI 変更前: **`design-change`**（本決定前比較は **`design-lab`**、本番採用は **`design-adoption`**、要望は **`design-feedback`**、コントラスト等は **`design-a11y`**）。モバイル UI: **`design-mobile`**。変更後: `secure-change-checklist`（該当時）
11. 画面/API を変えたら `python scripts/generate_product_docs.py`。デザイン gaps は `python scripts/generate_design_docs.py`
12. Dash 時代の詳細は `.cursor/rules/reference/` と `.cursor/plans/archive/`（**ARCHIVE**。新規設計に使わない）

ブランチ・PR の詳細フローはチーム合意に従う。強制 push や `--no-verify` は禁止（AGENTS.md）。
