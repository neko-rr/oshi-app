# `.cursor/rules`（Cursor Agent 用）

## 形式（必須）

- 拡張子は **`.mdc`**
- 先頭に YAML frontmatter:

```yaml
---
description: ルールピッカー用の短い説明（いつ効くか）
alwaysApply: true   # または false
globs: apps/api/**/*  # alwaysApply false のとき任意
---
```

- 本文は **エージェントへの命令**（「〜せよ / するな」）。手記や長い解説は `reference/` か `docs/`。
- 目安: **1 ファイル 1 用途・50 行前後**。

## 頻度の使い分け

| 設定 | 使うとき |
|------|----------|
| `alwaysApply: true` | 毎会話で守らせる（security / auth / naming 等） |
| `globs: ...` | 該当パスを触るときだけ（api / sql / mobile） |
| `alwaysApply: false` のみ | デプロイ等、パスで切れないが常時は重いもの |

## ファイル一覧

| ファイル | 頻度 |
|----------|------|
| architecture.mdc | always |
| security.mdc | always |
| auth.mdc | always |
| platform.mdc | always |
| naming.mdc | always |
| tdd.mdc | always |
| api_contract.mdc | globs api/shared |
| database.mdc | globs api/sql/**docs/db** |
| supabase-library.mdc | globs web |
| mobile.mdc | globs mobile |
| design.mdc | globs web / docs/design → **`docs/design/`** |
| deploy.mdc | 手動/description |
| spec.mdc | 手動/description → **`docs/product/`** |
| reference/* | ARCHIVE 寄り。**DB は `docs/db/`**。**製品は `docs/product/`**。**デザインは `docs/design/`** |

Skills: `db-schema-change` / **`product-spec-sync`** / **`design-change`** / **`design-lab`** / **`design-adoption`** / **`design-feedback`** / **`design-a11y`** / **`design-mobile`**

文書の更新区分（手 / 自動 / エージェント）: `docs/README.md`  
入口: リポジトリ直下 `AGENTS.md`
