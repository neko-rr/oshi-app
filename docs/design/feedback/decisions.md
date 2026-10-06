<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# デザイン決定ログ（accepted のみ）

**決まったことだけ** 時系列で残す。pending は [inbox.md](inbox.md) / `meta/feedback_items.json`。

| 日付 | ID | 要約 | 反映先 |
|------|-----|------|--------|
| 2026-10-06 | fb-017 | 文字パック4種（清潔／やわらか／雑誌・大人／読みやすい）。日英セット。既定 clean。テーマ色と独立 | [tokens.md](../tokens.md) · `/settings/theme` |
| 2026-09-16 | fb-015 | 画風マスターをくらげ（jelly-nuance）に更新。7体を同雰囲気で差し替え。旧 cat/dog 削除 | [mascot-asset-brief.md](../mascot-asset-brief.md) · [mascots.md](../mascots.md) |
| 2026-09-16 | fb-014 | 庇護欲×MIDORI画風を7体の scenes P0 に展開。くらげは現行維持 | [mascot-asset-brief.md](../mascot-asset-brief.md) · [mascots.md](../mascots.md) |
| 2026-09-16 | fb-013 | マスコット北極星を明文化: 庇護欲をそそる愛らしいキャラ×大人かわいいお洒落画風 | [mascot-asset-brief.md](../mascot-asset-brief.md) |
| 2026-09-16 | fb-012 | マスコットは「幼児顔の愛嬌は可／子供向け画風は不可」と明記。目を小さくする指示は撤回 | [mascot-asset-brief.md](../mascot-asset-brief.md) |
| 2026-09-16 | fb-011 | マスコット画風マスターは MIDORI系大人手帳シール／大人文具。画風は採用・シート密度は非採用。brief 正本化 | [mascot-asset-brief.md](../mascot-asset-brief.md) |
| 2026-09-16 | fb-010 | 大人推し活向け A〜B を正本化（voice・階層・感情予算・プライバシ・バッジ予算・トーン差分・店頭）。エージェント命令は design.mdc | [voice.md](../voice.md) · [principles.md](../principles.md) · [components.md](../components.md) · design.mdc |
| 2026-09-16 | fb-009 | マスコットは大人のお洒落かわいいをブランド正とする。制作指針・新規キャラ手順を brief に正本化 | [mascot-asset-brief.md](../mascot-asset-brief.md) · [mascots.md](../mascots.md) |
| 2026-09-16 | fb-008 | マスコット全候補（風ねこ／ねこ／いぬ／シマエナガ／くらげ／青い鳥）＋none を選択可。場面パス正本化。端末選択UI | [mascots.md](../mascots.md) · [meta/mascots.json](../meta/mascots.json) · `/settings/theme` |
| 2026-09-16 | fb-007 | マスコット既定は風ねこ。none（キャラ無し通常UI）も選択可 | [mascots.md](../mascots.md) · [meta/mascots.json](../meta/mascots.json) |
| 2026-09-16 | fb-006 | トーン強度設定（落ち着き／推し活フル）を採用。手動本線・スケジュール任意。実装は別承認 | [principles.md](../principles.md) · [themes.md](../themes.md) |
| 2026-09-16 | fb-005 | 形・質感・タイポを正本化。トーン強度は落ち着き／推し活フル（手動本線・スケジュール任意）。器ニュートラル×推し色で熱 | [principles.md](../principles.md) · [tokens.md](../tokens.md) · [icons.md](../icons.md) |
| 2026-09-16 | mascot-adult-breeds | 画風を大人のお洒落かわいいへ差し替え・キーホルダー禁止を明文化。ねこ＝三毛／スコ、いぬ＝柴／ポメに分割 | [mascot-asset-brief.md](../mascot-asset-brief.md) · [mascots.md](../mascots.md) · [meta/mascots.json](../meta/mascots.json) |
| 2026-09-16 | fb-003 | アプリマスコットは選択可。既定は風ねこ。ポーズ idle/loading/not_found/celebrate。DB `character` とは別 | [mascots.md](../mascots.md) · [meta/mascots.json](../meta/mascots.json) |
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
