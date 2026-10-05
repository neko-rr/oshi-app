<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# マスコット（アプリの顔）

**状態:** ブリーフ正本化済。素材は P0〜P1 で整備。**部品の本番配線・サーバー保存は別承認。**

グッズ属性の DB 表 `character` とは **別概念**。  
**ブランド指針（大人のお洒落かわいい・新規キャラ追加）の正本:** [mascot-asset-brief.md](mascot-asset-brief.md)

20〜30代推し活層向けは「全面かわいい」ではなく、**中庸の愛嬌 × 短い動き × 感情のワンポイント**。  
調査との対応: 器はニュートラル、熱は推し色＋写真。マスコットは **熱のアクセント**。

## 正本

| 何 | どこ |
|----|------|
| **ブランド・新規追加の指針** | [mascot-asset-brief.md](mascot-asset-brief.md) |
| 本ファイル | 使い方・ファイル／優先度チェックリスト |
| カタログ | [meta/mascots.json](meta/mascots.json) |
| Web 資産 | `apps/web/public/brand/mascots/<id>/` |
| 共有骨格 | `apps/web/public/brand/mascots/_shared/parts/` |

## 1. 使い方の原則

| やる | やらない |
|------|----------|
| 空状態・待ち・保存成功・404 など **感情点だけ**に出す | 全画面をキャラで埋める |
| **部品（parts）**で短いループ／ノブ／完了リアクション | 場面絵をスピナーにそのまま回す |
| キャラごとの **シグネチャ小物**で動きを作る | キラキラ常時パーティクル |
| `prefers-reduced-motion` 用の **静止1枚**を必ず用意 | 動き前提だけの素材 |
| **庇護欲のある愛らしいキャラ**を **くらげと同質の大人お洒落画風**（jelly-nuance）で | **子供向けの画風**。かわいさ／庇護欲を消してシリアス顔だけにするな |

## 2. 素材は2層（必須）

### A. 場面（scenes）— 大きく見せる絵

**用途:** 空状態、404、祝福、（大きめ）ローディング差し替え  
**形式:** 透過 PNG 想定、正方形寄り（推奨 1024px、最低 512）  
**背景:** なし（アプリ背景に乗せる）。生成時は単色白でも可（実装で抜く）

| ファイル | 感情 | UIでの使い所 |
|----------|------|----------------|
| `idle.png` | 穏やか・待機 | 空ギャラリー、設定プレビュー |
| `not_found.png` | 困った・探してる | 404、0件検索 |
| `celebrate.png` | 短い喜び | 登録完了・件数達成（スポットのみ） |
| `loading.png` | 静止フォールバック | reduced-motion／最初の1フレーム |
| `loading_01`〜`03.png` | 軽いループ | フル画面待ち（任意。3枚で十分） |

### B. 部品（parts）— 動き・ワンポイント用（本命）

**用途:** スピナー、プログレス、インライン待ち、保存フラッシュ横、タップ反応  
**形式:** 透過 PNG（顔・小物）、骨格は SVG（`currentColor`）  
**サイズ目安:** 顔 256〜512px、小物 128〜256px、`face_sm` 128px

| 部品 | 必須度 | 動きの使い方（150〜250ms〜短いループ） |
|------|--------|----------------------------------------|
| `face.png` | **必須** | スピナー中心・バー左 |
| `face_sm.png` | **必須** | ボタン横・一覧の小さな待ち |
| **シグネチャ小物**（キャラ固有） | **必須** | バーのノブ／周回／追いかけ |
| 完了マーク部品 | 推奨 | 保存成功のワンショット |
| 装飾ドット（弱） | 任意 | ごく薄いきらめき（常用しない） |
| `spinner_ring.svg` | 推奨（`_shared` 可） | テーマ色で回るリング |
| `bar_track.svg` | 任意 | CSSで代替可 |

**完成場面絵を部品代わりにしない。**

## 3. キャラ別シグネチャ

| id | 名前 | フォルダ | シグネチャ | 完了 | 動き |
|----|------|----------|------------|------|------|
| `kaze_neko` | 風ねこ（こねこ・**既定**） | `kaze_neko/kit/` | yarn_ball・渦尻尾 | paw | 毛糸追い |
| `kaze_neko_adult` | 風ねこ（おとな） | `kaze_neko/adult/` | （kit parts 共有） | paw | 同上・体はおとな |
| `calico` | **三毛猫**（こねこ） | `calico/kit/` | bell | paw | 鈴ころころ |
| `calico_adult` | **三毛猫**（おとな） | `calico/adult/` | （kit parts 共有） | paw | 同上 |
| `scottish_fold` | スコ（こねこ） | `scottish_fold/kit/` | yarn_ball | paw | 穏やか |
| `scottish_fold_adult` | スコ（おとな） | `scottish_fold/adult/` | （共有） | paw | 同上 |
| `shiba` | 柴犬（こねこ） | `shiba/kit/` | ball | paw | 弱バウンド |
| `shiba_adult` | 柴犬（おとな） | `shiba/adult/` | （共有） | paw | 同上 |
| `pomeranian` | ポメ（こねこ） | `pomeranian/kit/` | ball | paw | ふわっと |
| `pomeranian_adult` | ポメ（おとな） | `pomeranian/adult/` | （共有） | paw | 同上 |
| `shimaenaga` | シマエナガ | `shimaenaga/` | seed | fluff | ふわふわ |
| `jellyfish` | くらげ（**画風マスター**） | `jellyfish/` | bubble | bubble_pop | ゆったり |
| `bluebird` | 幸せの青い鳥 | `bluebird/` | feather | letter | 羽の角度 |
| **`none`** | 指定なし | — | — | — | shadcn のみ |

**三毛の色:** 白＋黒＋茶（オレンジ）の三色必須。**ハチワレ／タキシード（白黒のみ）は不合格**（別キャラ）。

旧 ID: `cat`→`calico`、`dog`→`shiba`（sanitize のみ。**素材 `cat`/`dog` は削除済**）。  
**キーホルダー風は不合格**。

## 4. 優先度（チェックリスト）

### P0 — 場面4種

- [x] くらげを画風マスターとして維持
- [x] 単系統（シマエナガ／くらげ／青い鳥）を jelly-nuance で整備
- [x] 風ねこ／三毛／スコ／柴／ポメを **`{kit\|adult}/scenes`** に分けて P0 整備
- [x] 旧 `cat`/`dog` フォルダ削除

### P1 — parts

- [x] kit/parts（おとなは当面 kit 部品を共有）

### P2 — 品質・統一

- [ ] 線・瞳・余白のさらに厳密な揃え
- [ ] 真の透過 PNG 化
- [ ] LOFT テストの人レビュー
- [ ] おとな専用 parts

### 後回し

常時ループ大アニメ／表情差分10種以上／季節バリエーション／他キャラ loading_01–03

## 5. 技術スペック（作成プロンプト用）

```text
- 透過 PNG（背景なし）。単色白背景の生成も可
- 正方形キャンバス、被写体は中央・余白最小だが切れない
- 輪郭は中庸の丸み（極端なちび・極端にシャープ禁止）
- 大人の女性向けお洒落かわいい／くらげと同質の jelly-nuance。子ども商品・ガチャ絵禁止
- 詳細トーン・不合格例・新規追加手順は mascot-asset-brief.md（画風正は jellyfish idle）
- 文字・ロゴ・キーホルダー金具・透かし禁止
- 部品は単体で切り抜き可能（合成前提）
- 動き用は「1部品＝1役割」。複雑な背景シーンは scenes へ
- loading 連番はポーズ差を小さく（ジャンプ幅大は避ける）
```

### フォルダ規約

現行（公開）は `apps/web/public/brand/mascots/`。旧版・原案はそこへ置かない。  
見比べ用は `apps/web/brand-archive/mascots/`（非公開。相対パスは現行と同じ）。

```text
public/brand/mascots/          … アプリが使う現行のみ
  _shared/parts/
  jellyfish/ · shimaenaga/ · bluebird/
  kaze_neko/ · calico/ · scottish_fold/ · shiba/ · pomeranian/
    kit/scenes/ · kit/parts/
    adult/scenes/

brand-archive/mascots/         … 差し替え前・生成の種・風ねこ原案
```

## 6. UI配置マップ

| 画面／瞬間 | 層 | 素材 |
|------------|-----|------|
| ギャラリー0件 | scenes | `idle` |
| 検索0件／404 | scenes | `not_found` |
| 登録完了・達成 | scenes（短）or parts完了 | `celebrate` or `paw` 等 |
| API待ち・アップロード | parts | `face` + 小物周回／バーノブ |
| インライン保存中 | parts | `face_sm` |
| トーン「落ち着き」 | — | 出さない or `none` |
| トーン「推し活フル」 | scenes+parts | 出現頻度・サイズ↑（実装は後） |

## 7. 選択モデル（実装メモ）

| `mascot_id` | 待ち | 空・404・祝福 |
|-------------|------|----------------|
| `kaze_neko`（既定） | parts（配線後）／当面 scenes loading | scenes |
| 他キャラ | parts 準備後／当面 scenes loading | scenes |
| `none` | **現行 shadcn のみ** | キャラ画像なし |

## 関連

- **ブランド指針・新規追加:** [mascot-asset-brief.md](mascot-asset-brief.md)  
- [principles.md](principles.md) · [motion.md](motion.md) · [themes.md](themes.md) · [oshi-accents.md](oshi-accents.md)
