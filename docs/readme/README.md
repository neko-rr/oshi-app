<!-- 更新: 手 — README 用アセット。凡例: docs/README.md -->
# README 用アセット

ルート [README.md](../../README.md) 向けのスクリーンショット置き場。

| ファイル | 内容 |
|----------|------|
| `screenshots/01-gallery.png` | ギャラリー（所持・種類・収納） |
| `screenshots/02-register-confirm.png` | 登録確認（正面写真と商品名） |
| `screenshots/03-register-tags.png` | 写真からの見た目タグ提案 |
| `screenshots/04-register-place.png` | 種類・収納場所・グッズの色 |
| `screenshots/05-theme.png` | テーマ色 |
| `screenshots/06-color-share.png` | 推し色の割合 |

2026-10-14 の実機撮影を、README 用に幅 720px へ縮小して置いている。元画像はリポジトリに置かない。

公開トップだけの自動撮影は `apps/web/scripts/capture_readme_screenshots.mjs`。今の README が参照するファイル名とは別なので、実行しても上の6枚は置き換わらない。連続遷移すると Cloudflare Worker 1102 になることがある。
