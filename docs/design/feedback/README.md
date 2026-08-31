<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# デザインフィードバック（ブランドを育てるループ）

**すぐ決めなくてよい。** 違和感・要望は **pending（未決）** のまま残し、あとから採用／後回し／却下する。

skill: **`design-feedback`**

## なぜあるか

デザインに詳しくなくても、次の流れでブランド固有のルールが育つ:

1. 「ここが気になる」を **inbox** または会話で伝える  
2. エージェントが **pending** として `meta/feedback_items.json` に記録（勝手に本番反映しない）  
3. Design Lab や次のセッションで一覧を見る  
4. **採用 / 後で / 却下** だけ答える  
5. 採用分だけ `components.md` 等に1〜数行 → **decisions.md** に記録  

## 置き場

| ファイル | 役割 | 更新 |
|----------|------|------|
| [inbox.md](inbox.md) | 人の走り書きメモ | **手** |
| [decisions.md](decisions.md) | 決まったことの履歴 | **手**（採用時はエージェント追記可） |
| [../meta/feedback_items.json](../meta/feedback_items.json) | 構造化一覧（status 付き） | **エージェント**（承認後） |
| [../meta/README.md](../meta/README.md) | meta の説明 | **手** |

## ステータス（語彙）

| status | 意味 | あなたがすること |
|--------|------|------------------|
| `pending` | 未決・保留でよい | 何もしなくてよい |
| `accepted` | ルールに落とす | エージェントが docs に反映（承認後） |
| `deferred` | 後で | 忘れないよう pending のまま or deferred |
| `rejected` | 今回はやらない | メモだけ残る |

**accepted にするのは人の明示指示後のみ。** エージェントが勝手に accepted にしない。

## 1件に書くこと（最小）

- **どこ** — 画面名 / 部品（ボタン・一覧・推し色など）  
- **要望** — あなたの言葉（「もっと柔らかく」でよい）  
- **任意** — Lab の案 A/B/C、端末（PC / モバイル）

## 反映先の目安

| 内容 | 書く先 |
|------|--------|
| ボタン・入力・カードの使い分け | [components.md](../components.md) |
| アイコン追加・禁止 | [icons.md](../icons.md) |
| 余白・色・推し色 | [tokens.md](../tokens.md) / [oshi-accents.md](../oshi-accents.md) |
| 雰囲気・Do/Don't | [principles.md](../principles.md) |
| 動き | [motion.md](../motion.md) |

## shadcn との関係

[shadcn/ui](https://ui.shadcn.com/) は **ベース**。ブランド固有の差は上記 docs に蓄積し、必要なら `components/ui` を **拡張**する（ゼロから別 Button を増やさない）。

## 関連

- 比較: [compare-workflow.md](../compare-workflow.md) / skill `design-lab`  
- 本番反映: skill `design-change`  
