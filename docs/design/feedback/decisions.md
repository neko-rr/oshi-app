<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# デザイン決定ログ（accepted のみ）

**決まったことだけ** 時系列で残す。pending は [inbox.md](inbox.md) / `meta/feedback_items.json`。

| 日付 | ID | 要約 | 反映先 |
|------|-----|------|--------|
| 2026-09-01 | theme-lab-b | 色設定 UI は Lab B。枠黒＝ライト／枠白＝ダーク。ダークは文字色をパック fg に | `/settings/theme` · ThemePicker |
| 2026-09-01 | fb-002 | Lab スマホ枠は縦／横／縦+横（同時）。Web・モバイルとアプリで共通 | [compare-workflow.md](../compare-workflow.md) |
| （例） | fb-001 | 主ボタンは `default` のみ1画面1つ | [components.md](../components.md) |

## 書き方

- 1行 = 1決定  
- 「なぜ」を1文足してもよい（後から読むため）  
- 却下・後回しはここには書かない（JSON の status で足りる）  
