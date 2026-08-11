# Git hooks（秘匿ガード）

このディレクトリを Git の hooks として使う。

## 初回（クローン後・init 後）

リポジトリルートで **ローカルのみ** 設定する（グローバル `git config --global` は使わない）:

```powershell
git config core.hooksPath .githooks
```

確認:

```powershell
git config --local --get core.hooksPath
# => .githooks
```

## 中身

| ファイル | タイミング | 内容 |
|----------|------------|------|
| `pre-commit` | commit 直前 | `secret_guard` → `naming_check` |

`--no-verify` / `-n` は Cursor hook 側でも拒否する。

## 手動チェック

```powershell
python scripts/secret_guard.py check-staged
python scripts/naming_check.py check-staged
python scripts/naming_check.py check-paths path\to\file
```
