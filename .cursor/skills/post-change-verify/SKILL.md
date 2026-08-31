---
name: post-change-verify
description: >-
  コード変更後に monorepo の API pytest と Web typecheck を実行する。
  apps/web・apps/api・packages を触った直後に適用する。
---

# 変更後検証（v2）

## 実行場所

モノレポルート（`pnpm-workspace.yaml` がある階層）

## 実行順

### API を触った場合

```powershell
$env:PYTHONPATH = "apps/api"
python -m compileall -q apps/api/app
python -m pytest apps/api/tests tests -q
```

### Web / shared を触った場合

```powershell
pnpm -C packages/shared build
pnpm -C apps/web lint
pnpm -C apps/web exec tsc --noEmit
```

### デザイン docs / tokens（触った場合）

```powershell
python scripts/check_design_tokens.py
python scripts/generate_design_docs.py
```

`docs/design/generated/gaps.md` を確認（Lab 未採用・hex 等）。

### デザイン icons（meta を触った場合）

`docs/design/meta/icons.json` を変えたら **必須**:

```powershell
python scripts/sync_design_icons.py
python scripts/sync_design_icons.py --check
```

### デザイン compliance（web UI を触った場合）

```powershell
python scripts/check_design_compliance.py
python scripts/sync_design_icons.py --check
```

### 両方

API → Web の順。ローカルで CI 相当の docs 検査:

```powershell
python scripts/check_docs_drift.py
```

### 製品 as-built（ルート変更時）

次のいずれかを変えたら **必須**:

- `apps/web/src/app/**/page.tsx` / `route.ts`
- `apps/api/app/routers/**`
- `apps/api/app/services/*_service.py`
- `packages/shared/src/index.ts` の `API_PATHS`

```powershell
python scripts/generate_product_docs.py
```

`docs/product/generated/gaps.md` を確認（`missing_expected_*` / `unexpected_*`）。意図（value / roadmap / flows / acceptance）の更新が必要なら skill **`product-spec-sync`**。

CI（GitHub Actions）は上記の主要チェックを push/PR で自動実行する。

### ローカル ↔ CI 対応（迷ったらここ）

| ローカル（skill / コマンド） | CI ジョブ |
|------------------------------|-----------|
| `secret_guard` / `naming_check` | `secret-and-naming` |
| `compileall` + pytest / `pnpm test:api` | `api-compile-pytest` |
| `check_api_contract_sync` / `pnpm check:api-contract` | 同上（API contract sync ステップ） |
| `pnpm lint:web` / `typecheck:web` / `build:web` | `web-lint-typecheck-build` |
| design tokens / icons `--check` / compliance | `design-quality` |
| `check_docs_drift` | `docs-generated-drift` |

## スキップ

- md / plans のみ（ただし `docs/product/meta`・flows・acceptance を触ったら `product-spec-sync`）
- アセットのみ

## TDD

振る舞い変更は先にテスト（`tdd.md` / `tdd-workflow`）。

## 秘密

JWT・キー・署名 URL をログに貼らない。

## 委譲

長い検証は **Task(shell) に委譲可**（合否と要点だけ親へ。生ログ全文は貼るな）。表: `AGENTS.md`「Skill → Task / サブエージェント」。
