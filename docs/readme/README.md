<!-- 更新: 手 — README 用アセット。凡例: docs/README.md -->
# README 用アセット

ルート [README.md](../../README.md) 向けのスクリーンショット置き場。

| ファイル | 内容 |
|----------|------|
| `screenshots/01-home-desktop.png` | 本番トップ（デスクトップ） |
| `screenshots/01-home-mobile.png` | 本番トップ（モバイル） |
| `screenshots/02-login-mobile.png` | 本番ログイン |
| `screenshots/03-signup-mobile.png` | 本番新規登録 |
| `screenshots/05-register-guest.png` | 製品登録（ゲスト開始後） |

再撮影: `pnpm -C apps/web exec node scripts/capture_readme_screenshots.mjs`  
連続遷移すると Cloudflare Worker 1102 になることがある。間隔を空けるか、必要な画面だけ撮る。
