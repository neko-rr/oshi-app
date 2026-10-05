<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# マスコット制作ブリーフ（ブランド指針）

**誰向け:** イラスト生成・別セッションの作成者・レビューする人  
**いつ読む:** 新規キャラ追加・既存素材の差し替え・「意図と違う」と感じたとき  
**運用・ファイル一覧の正本:** [mascots.md](mascots.md)  
**カタログ:** [meta/mascots.json](meta/mascots.json)

---

## ブランドの北極星（一言）

> **20・30代が庇護欲をそそられる愛らしいキャラを、くらげと同質の大人かわいいお洒落画風で描く。**

これが全部。

| 層 | やること | やらないこと |
|----|----------|--------------|
| **キャラ（庇護欲）** | 小さく愛らしい・幼児顔・守ってあげたくなる | クールな大人顔だけ／かわいさを消す |
| **画風（お洒落）** | **くらげ基準**の極細線・ニュアンス淡彩・紙粒感 | 子供向けアニメ・ぬりえ・ガチャアクリル |

対象: **20〜30代の推し活ユーザー**。アプリはニュートラルな器。マスコットは感情のワンポイント。

---

## 読み違えないこと

| OK | NG（誤読） |
|----|------------|
| 大きな目・丸い頬・小さな体で **庇護欲** | 「大人向けだから目を小さく・シリアス顔に」 |
| 画風をくらげと同質に揃える | 「かわいい＝子供向け画風でよい」 |
| 毛ものは **にじみ＋紙粒**でくらげ感を出す | くらげの半透明を毛にそのままコピー（幽霊っぽくなる） |

嫌なのは「キャラがかわいいこと」ではない。  
嫌なのは **子供向け商品のような描き方**。

---

## 画風マスター（採用・2026-09-16 更新）

### 正の参照（ロック）

| 優先 | ファイル | 役割 |
|------|----------|------|
| **1（画風の正）** | `jellyfish/scenes/idle.png` | **くらげ。** 線・色・粒・空気感のマスター |
| **2（哺乳類の転写見本）** | `calico/scenes/idle.png` または `kaze_neko/scenes/idle.png` | 毛ものへの寄せ方（透けの代わりににじみ＋粒） |

**呼び方（社内）:** nuance（ニュアンス）淡彩の大人文具イラスト／くらげ風（jelly-nuance）。  
語彙の近い市販例: MIDORI／LOFT 系手帳シール。ただし **市販シールの複製は禁止**。完成見本はアプリ内くらげ。

| 採用 | 不採用 |
|------|--------|
| 極細の繊細な線（純黒ではなくくすみ炭・ティール寄り） | キッズ太いフチ・原色ベタ塗り |
| くすみミント／ピーチ／クリームのニュアンスグラデ | アクリルふち・金具・ビニール光沢 |
| 紙粒・点描に近いマットなテクスチャ | ガチャ／キーホルダー商品画 |
| **庇護欲のある幼児顔** | 「目を小さくして大人顔に」（禁止） |
| 小物は最大1つ・1体＋円形の余白 | ハート・星スパム／シート密度 |

### くらげ → 哺乳類・鳥への転写ルール

| くらげの勝ち筋 | 毛もの・鳥での代替 |
|----------------|-------------------|
| 半透明・色のにじみ | **不透明のまま**、境界をにじませ紙粒を乗せる（透けの直コピー禁止） |
| リボン状の流動形 | 毛束・羽根は同じ線の細さと粒感で「やわらかさ」を出す |
| パーツが少ない | 目・鼻・耳は庇護欲用に残す。水っぽいハイライトはくらげと同質 |

差は **種の色とシグネチャ小物だけ**。画風をキャラごとに変えるな。

### 展開状態（2026-09-16）

| 対象 | P0 | 備考 |
|------|-----|------|
| `jellyfish` | **触らない（画風マスター）** | 差し替え禁止 |
| `shimaenaga` · `bluebird` | 単系統 `scenes/` | jelly-nuance |
| `kaze_neko` · `calico` · `scottish_fold` · `shiba` · `pomeranian` | **`{kit\|adult}/scenes/`** | こねこ／おとな選択可。parts は当面 kit |
| `calico` 色 | **三毛＝白＋黒＋茶** | **ハチワレ／タキシード（白黒のみ）は不合格** |
| 旧 `cat` / `dog` | **削除済** | 再掲禁止 |

次は載せ方ロック → 本線 UI。おとな専用 parts は別承認。

---

## UX 作業順

1. 載せ方（空状態サイズ等）を軽く固定  
2. 画風マスターをくらげでロック ← **済**  
3. 他キャラをくらげ雰囲気で統一 ← **済**  
4. 本線 UI のニュートラル整備  

`器ニュートラル × 熱は推し色・写真 × マスコットは感情点`

---

## ビジュアル契約

### Do

- **キャラ:** 庇護欲（幼児顔・丸み・守ってあげたい）  
- **画風:** くらげと同質（jelly-nuance／大人かわいいお洒落）  
- **必須語:** `protective-cute / 庇護欲` + `jellyfish-nuance adult stationery`  
- **風ねこ形:** 頬ピンピン・額縞・渦尻尾。キーホルダー **商品画風は禁止**  

### Don't（画風）

太いフチ／原色糖果／ガチャ光沢／アクリル金具／キッズアニメ塗り／シート密度／毛への半透明直コピー

### Don't（キャラ取り違え）

- **三毛（`calico`）** をハチワレ・タキシード・白黒のみにするな（白＋黒＋茶が必須）
- スコの折り耳を立て耳にするな
- 風ねこの渦尻尾・額縞・セージを消すな

### Don't（誤指示）

目を小さくしてシリアス顔にするな。かわいさを消すな。**庇護欲を殺すな。**

**合格:**  
「見て **庇護欲**が湧くか？　**くらげの idle と並べて画風が同族か？**」  
どちらか欠けたら不合格。

---

## 生成プロンプト（コピペ）

```text
GOAL: Protective-cute (庇護欲) for women 20s–30s — adorable baby-schema character
you want to take care of — in the SAME art style as our jellyfish mascot
(jelly-nuance adult stationery).

STYLE LOCK: Match jellyfish/scenes/idle.png exactly in line weight, muted nuance
pastels (mint/peach/cream), soft watercolor gradients, fine paper grain/stipple,
airy matte feel. Ultra-thin delicate lines (charcoal/teal, not pure black).
NOT kids cartoon, NOT thick outlines, NOT gacha acrylic, NOT vinyl gloss,
NOT candy primary colors.

FOR FUR / FEATHERS: Do NOT copy jellyfish transparency (looks ghostly).
Use soft color bleed + paper grain like the jellyfish washes instead.

CHARACTER: Baby-faced protective-cute REQUIRED (soft large eyes, round cheeks).
Do NOT age into cool/serious adult face. Do NOT remove cuteness.

Single character, cream circular soft frame, one tiny prop max.
No hearts/stars spam. No acrylic/keychain hardware. No text, no logo.
```

風ねこ:

```text
FORM: pin-pin cheek tufts, forehead stripes, sage, spiral tail.
CHARM: protective-cute baby face. STYLE: same as jellyfish idle — never keychain look.
```

他キャラ:

```text
Same protective-cute + SAME jellyfish-nuance STYLE as jellyfish idle.
Differentiate only by species colors + one signature prop.
Reference mammal transfer: calico or kaze_neko idle (approved).
```

日本語核:

```text
【狙い】20・30代の庇護欲をそそる愛らしいキャラを、くらげと同質の大人お洒落画風で。
【顔】幼児顔・大きな目・丸みOK。かわいいを消すな。シリアス大人顔にするな。
【画風】くらげ基準（極細線・ニュアンス淡彩・紙粒）。毛は透け禁止・にじみ＋粒で寄せる。
【禁止】子供向けアニメ／ガチャ／キーホルダー絵。
```

---

## 新規キャラ手順

1. id ＋シグネチャ小物1つ  
2. style 参照は **必ず** `jellyfish/scenes/idle.png`（毛ものは calico／kaze_neko idle も可）  
3. P0 場面4種  
4. テスト: **庇護欲＋くらげと並べて同族か**  
5. P1 parts → カタログ更新  
6. サーバー／スピナーは別承認  

---

## 必須セット（1体）

| 優先 | 内容 |
|------|------|
| P0 | `idle` / `loading` / `not_found` / `celebrate` |
| P1 | `face` / `face_sm` / シグネチャ / 完了部品 |
| 任意 | `loading_01`〜`03` |

---

## 差し替え判断

1. くらげと並べて画風が違う／キッズ／ガチャ → 差し替え最優先  
2. 庇護欲が立たない → 幼児顔・愛らしい体に戻す  
3. 「目が大きい」だけで落とすな（庇護欲の核）  
4. 毛が半透明すぎて幽霊っぽい → にじみ＋粒に直す  

---

## 関連

- [mascots.md](mascots.md) · [principles.md](principles.md) · [motion.md](motion.md) · [meta/mascots.json](meta/mascots.json)
