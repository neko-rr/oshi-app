# Cursor エラー記録

## 2026-10-05: Windows で `pnpm install` が node_modules リンク中に止まる / EPERM

### 症状
- `EPERM: operation not permitted, rmdir '.../apps/web/node_modules/@radix-ui'`
- 解決（resolved 600）のあと数分以上進捗なし（リンク段階）
- `apps/web/node_modules` が無い／途中削除された状態で残ることがある

### 試したこと（失敗）
- `pnpm add next@latest`（peer 警告のあと EPERM）
- `pnpm install` / `--child-concurrency=1` / `--offline --ignore-scripts`
- `apps/web/node_modules` を先に削除して再実行

### できたこと
- `pnpm install --lockfile-only` は成功（`pnpm-lock.yaml` 更新）

### 再発時
1. `next dev` と Cursor 以外の Node を止める
2. エクスプローラーで `apps/web/node_modules` を開いていないことを確認
3. PowerShell: `pnpm install`
4. それでも EPERM なら一度再起動してから同じコマンド

依存の実体が入るまで `tsc` / `generate_third_party_notices` は走らせない。
