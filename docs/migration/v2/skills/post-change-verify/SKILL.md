---
name: post-change-verify
description: >-
  コード変更後に Web（TypeScript）と API（Python）の
  構文・型・テストを monorepo ルートから実行する。
  apps/web・apps/api・packages を触った直後に適用する。
---

# 変更後検証（v2 post-change-verify）

## いつ使うか

- `apps/web/`、`apps/api/`、`packages/` のソースを変更したあと
- 依存追加・import 変更のあと

## 実行場所

- **作業ディレクトリ**: monorepo ルート（`pnpm-workspace.yaml` がある階層）

## 実行順

### 1. API（Python）を触った場合

```powershell
cd apps/api
# 仮想環境があれば有効化
python -m compileall -q app
python -m pytest tests/ -q
```

`tests/` が未作成なら compileall まででよい。作成後は必ず pytest。

### 2. Web / shared（TypeScript）を触った場合

```powershell
pnpm -C packages/shared build
pnpm -C apps/web lint
pnpm -C apps/web exec tsc --noEmit
```

プロジェクトに `typecheck` script がある場合はそれを使う。

### 3. 両方触った場合

上記 1 → 2 の順。

## スキップしてよい場合

- ドキュメントのみ（`*.md`、`.cursor/plans/` のみ）
- 画像アセット差し替えのみ

## 秘密情報

- 失敗調査でも **環境変数値・JWT・Cookie・Supabase キー・署名 URL 全文**をログやチャットに貼らない

## 注意

- 緑でも結合不足の可能性はある。ログイン → 保護ページ → `/me` の手動確認を縦スライス時はセットにする

## TDD

機能追加・バグ修正では **先に失敗するテスト** を書く（[.cursor/rules/tdd.md](../../rules/tdd.md) / skill `tdd-workflow`）。
実装だけの完了扱いにしない。
