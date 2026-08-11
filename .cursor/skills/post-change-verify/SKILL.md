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

### 両方

API → Web の順。

## スキップ

- md / plans のみ
- アセットのみ

## TDD

振る舞い変更は先にテスト（`tdd.md` / `tdd-workflow`）。

## 秘密

JWT・キー・署名 URL をログに貼らない。
