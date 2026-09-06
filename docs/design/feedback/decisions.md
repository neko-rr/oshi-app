<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# デザイン決定ログ（accepted のみ）

**決まったことだけ** 時系列で残す。pending は [inbox.md](inbox.md) / `meta/feedback_items.json`。

| 日付 | ID | 要約 | 反映先 |
|------|-----|------|--------|
| 2026-09-06 | web-phone-ux-patterns | スマホ Web 店頭 UX の横断ルールを正本化（シェル lg・写真 fit・隣スワイプ・短い成功フラッシュ／再試行・最近条件） | [web-phone-ux.md](../web-phone-ux.md) |
| 2026-09-06 | gallery-image-fit-sync | 一覧写真フィット cover／contain は表示設定で同期。large は常に contain | 見た目設定 · ProductGalleryGrid |
| 2026-09-06 | gallery-detail-neighbors | 詳細は一覧並びの隣へスワイプ＋前後（ライトボックス中は製品遷移しない） | ProductDetailNeighborNav |
| 2026-09-06 | gallery-recent-filters | 最近使った検索・絞込は端末履歴（保存ビューと別）。ギャラリー＋検索 | GalleryRecentFilters |
| 2026-09-06 | feedback-flash-offline | 保存成功は短い上部フラッシュ。オフライン／失敗は再試行導線 | FeedbackProvider · NetworkRetryNotice |
| 2026-09-06 | responsive-more-hub | 「その他」タブ着地は /settings をハブ化（分析・設定・法務・ログアウト） | `/settings` |
| 2026-09-06 | responsive-shell-lab-a | スマホ Web シェルは Lab A（下部タブ: ギャラリー／登録／検索／その他。上部はブランド。lg+ はトップナビ。横向きでもタブ） | Header · BottomTabBar · AppChrome |
| 2026-09-04 | oshi-accent-dual | 推し色はテーマパックと別。メイン（ボタン）＋サブ（やわらかい面）の2色。文字色は AA 自動。無料はプレビューのみ | [oshi-accents.md](../oshi-accents.md) · `/settings/theme` |
| 2026-09-03 | motion-clarity-first | 本番モーションは「分かりやすさの短い反応」のみ。長い／遊びたっぷり常時UIは本線に載せない。祝福は将来スポット可。アプリ内動きオフ設定は作らない（OS の reduced-motion は追従） | [motion.md](../motion.md) · [principles.md](../principles.md) · [a11y.md](../a11y.md) |
| 2026-09-02 | gallery-lab-b | ギャラリー一覧・詳細は Lab B（写真主役・チップ・もっと見る・編集折りたたみ）。用途フィットと推し活感のバランス | `/gallery` · `/gallery/[id]` |
| 2026-09-01 | theme-lab-b | 色設定 UI は Lab B。枠黒＝ライト／枠白＝ダーク。ダークは文字色をパック fg に | `/settings/theme` · ThemePicker |
| 2026-09-01 | fb-002 | Lab スマホ枠は縦／横／縦+横（同時）。Web・モバイルとアプリで共通 | [compare-workflow.md](../compare-workflow.md) |
| （例） | fb-001 | 主ボタンは `default` のみ1画面1つ | [components.md](../components.md) |

## 書き方

- 1行 = 1決定  
- 「なぜ」を1文足してもよい（後から読むため）  
- 却下・後回しはここには書かない（JSON の status で足りる）  
