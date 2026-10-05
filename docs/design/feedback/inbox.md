<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# フィードバック inbox（走り書き）

**ここは自由に書いてよい。** 形式は崩して構わない。  
整理・JSON 化は skill `design-feedback`（エージェントが **承認後** に `meta/feedback_items.json` へ）。

## 書き方の例

```text
2026-08-31 ギャラリー
- 写真をもう少し大きくしたい（B に近い？）
- まだ決めない。pending で

2026-08-31 ボタン
- 主ボタンが固い。角をもう少し丸く？
- 採用するかは Lab 見てから
```

## 未整理メモ

2026-09-16 画風マスター＝くらげ（jelly-nuance）
- fb-015。くらげ以外を同雰囲気で差し替え。旧 cat/dog 削除

2026-09-16 マスコット北極星＝庇護欲×大人お洒落画風
- fb-013。かわいさを消すな。画風だけお洒落に

2026-09-16 マスコット：幼児顔OK／子供画風NG
- 意図訂正 → fb-012。目を小さくする指示は撤回

2026-09-16 マスコット画風 MIDORI系
- 大人手帳シール／大人文具を画風マスターに → fb-011 / mascot-asset-brief.md
- シート密度・市販素材の複製は禁止

2026-09-16 ボイス・エージェント強制（A〜B）
- voice.md / principles 階層・感情予算 / components バッジ予算 / design.mdc → fb-010

2026-09-16 マスコットブランド指針
- 大人のお洒落かわいいを正本化 → fb-009 / mascot-asset-brief.md
- 子供っぽい出力は LOFT テストで差し替え

2026-09-16 マスコット全選択
- 全候補＋none → fb-008 accepted。設定 `/settings/theme` で端末保存
- 風ねこ scenes loading_01〜03 正本化
- Spinner 本番配線・サーバー同期は未着手

2026-09-15 マスコット
- アプリの顔として「風ねこ」＋選べる候補（ねこ／いぬ／シマエナガ／くらげ／幸せの青い鳥）
- ポーズ: idle / loading / not_found / celebrate
- 資産: `apps/web/public/brand/mascots/`、正本ドラフト `docs/design/meta/mascots.json`
- 実装・DB（選択保存）は未承認 → fb-003 pending
- DB の `character`（グッズ）とは別

2026-08-31 Design Lab
- **セーフエリア（ノッチ）線** … 未実装。Expo／アプリ本番に近くなってから実装する
- 上端（ノッチ・ダイナミックアイランド）／下端（ホームインジケータ）にガイドラインを出し、主UIが帯に埋まらないか確認する用
- 今の Lab モバイル枠は見本段階のため、実寸とズレた線になりやすい → 後回し（fb-001 / deferred）
- 関連: skill `design-lab` / `design-mobile`、thumb ゾーンは実装済

---

<!-- 上に追記。決まったら decisions.md へ1行リンク -->
