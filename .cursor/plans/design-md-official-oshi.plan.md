---
name: DESIGN.md公式準拠・推し活
overview: designmd.ai / Google Stitch 由来の DESIGN.md 公式構成に沿い、推し活グッズ管理向けの記述と「形・ボタン・影」での可愛らしさ、Bootswatch 全テーマ許容を反映した執筆計画。
todos:
  - id: official-map
    content: 公式セクション（Colors/Typography/Spacing/Components/Elevation/Guidelines）と推し活プロダクトの対応表をDESIGN.md冒頭に1表で書く
    status: completed
  - id: colors-semantic
    content: Colors章：Bootswatch全テーマ前提のセマンティック色（primary/surface/text等）と「推し色アクセント」の使い分けを文章＋トークン表で記述
    status: completed
  - id: typography
    content: Typography章：日英フォント・スケール・数値表示ルール（dbc/Bootstrap前提）
    status: completed
  - id: spacing
    content: Spacing章：基準単位（例8px）・スケール・タッチターゲット最小値
    status: completed
  - id: components-oshi
    content: Components章：ボタン種別・カード・フォーム・ナビを、登録フロー/ギャラリー/設定と紐づけ。角丸・パディング・状態別の具体値
    status: completed
  - id: elevation-shadows
    content: Elevation章：ライト/ダーク別の影の段数・ぼかし・「怪しい可愛さ」用の控えめグロー等のルール（全テーマで破綻しない書き方）
    status: completed
  - id: guidelines
    content: Guidelines章：Do/Don't、トーン、テーマ切替後の自己チェックリスト（コントラストはテーマ依存で目標値を明記）
    status: completed
  - id: appendix-routes
    content: 付録：file_structure/specの主要URLと優先画面（任意・短く）
    status: completed
isProject: false
---

# DESIGN.md 執筆計画（公式準拠 × 推し活グッズ管理）

## 参照した公式の要点

[What is DESIGN.md?](https://designmd.ai/what-is-design-md) および由来の Google Stitch 系ドキュメントで示されている **ポータブルな1ファイルのデザインシステム** として、典型的に次を含める:

| 公式セクション | 内容の要旨 |
|----------------|------------|
| **Colors** | Primary、ニュートラル、セマンティック色、hex と用途 |
| **Typography** | ファミリー、サイズ、ウェイト、行間、用途別 |
| **Spacing** | 基準単位とスケール（padding/margin/gap） |
| **Components** | ボタン種別、入力、カード、具体的な寸法・色 |
| **Elevation** | 影の段階、グロー、重なりの深さ |
| **Guidelines** | Do/Don't、トーン、デザイン原則 |

本計画では、プロジェクトの [.cursor/rules/spec.md](c:\Users\ryone\Desktop\oshi-app\.cursor\rules\spec.md)（機能・スマホ・dbc・Bootswatch・Bootstrap Icons）および [.cursor/rules/file_structure.md](c:\Users\ryone\Desktop\oshi-app\.cursor\rules\file_structure.md)（URL・構成）と **1対1で矛盾しない** ように [DESIGN.md](c:\Users\ryone\Desktop\oshi-app\DESIGN.md) を埋める。

---

## 方針の更新（ユーザー指示の反映）

1. **テーマ**: Bootswatch **全件選択でよい**。キュレーション必須の方針は取り下げる。代わりに「テーマが変わっても DESIGN で守るべきルール」を **セマンティック＋実装マッピング** で書く（例: 本文と背景のコントラストは各テーマの変数上で可能な限り AA を目指す、未達なら警告は UI ではなくドキュメント上の既知制約として記す、等）。
2. **推し活らしい可愛らしさ**: 色だけに頼らず、**形（角丸・有機的なカプセル）・ボタン（階層・ホバー/pressed）・影（Elevation）** のルールで表現する。ダーク系の「怪しい可愛さ」も **Elevation と境界線・微発光** のレンジ内で定義可能にする。

---

## DESIGN.md 推奨アウトライン（公式＋推し活固有の薄い追加）

公式6章を **そのまま H2 見出し** にし、推し活向けは **H3 で細分化** する。

```text
# 推し活グッズ管理 — DESIGN.md

## Product context（任意・短い）
  ターゲット、dbc/Bootswatch/Icons、テーマ全件可の宣言

## Colors
  （公式どおり）＋ 推し色アクセントの使い所

## Typography
  （公式どおり）＋ 日本語本文の優先

## Spacing
  （公式どおり）＋ スマホ優先

## Components
  （公式どおり）＋ 登録/ギャラリー/設定への対応表

## Elevation
  （公式どおり）＋ ライト/ダークの気分バリエーション

## Guidelines
  （公式どおり）Do/Don't、原則、AI実装時の注意
```

「Visual Theme & Atmosphere」は **Guidelines または Product context** に吸収し、公式の **Guidelines** と重複しないよう1か所にまとめる。

---

## ステップバイステップ（執筆順）

### Step A — メタと対応表（1ページ）

- DESIGN.md の目的（AIエージェント・人間開発者が同じルールで UI を触る）を1段落。
- 上記 **公式6章 ↔ 本アプリ画面** の対応表（例: Components → 登録フロー、ギャラリーカード、設定テーマ選択）。

### Step B — Guidelines（先に短く固定）

- デザイン原則 3〜5 本（例: 写真とグッズ情報を主役に、装飾は控えめ、テーマはユーザー趣味の表現領域）。
- **可愛らしさの表現手段** を明示: **border-radius スケール**、**ボタン variant 使い分け**、**Elevation レベルと用途**（ここを後の Components/Elevation で参照する）。

### Step C — Spacing

- 基準単位（例: 4 または 8）、推奨スケール、最小タップ領域（スマホ spec 整合）。

### Step D — Typography

- 見出し／本文／キャプション／価格数値。フォントスタック（システム＋Webフォントの有無を決めて記述）。**rem 基準**。

### Step E — Colors（テーマ全件前提）

- **固定 hex の羅列は「ブランド固定色」に限定**し、画面の大半は **Bootstrap/Bootswatch のセマンティック（primary, body-bg, body-color 等）に従う** と明記。
- **推し色**（ユーザー設定）: アクセントに限定するルール（バッジ、枠、小面積）を Colors と Components の両方に1行ずつ相互参照。
- ダークテーマ含む全テーマで、**本文可読性の目標**（例: 通常本文で WCAG AA を目指す。テーマ由来で達成できない組み合わせは「既知の例外」として列挙するか、将来 CSS で上書きする予定を Guidelines に書く）。

### Step F — Elevation（推し活の「可愛さ」の柱）

公式どおり **影の段階** を定義:

- Level 0: フラット（背景との一体感）
- Level 1: カード・リスト行の区切り（軽い `box-shadow` または border）
- Level 2: モーダル・ドロップダウン・FAB 的ボタン
- **ダーク向け**: 強すぎない外光／内側シャドウ／細いハイライトボーダーで「怪しい可愛さ」を **色ではなく光の取り方** で指定（具体は CSS 変数または「dbc の card に追加するクラス名」レベルでよい）

### Step G — Components（形・ボタン）

- **ボタン**: primary / outline / subtle の用途、**角丸トークン**（例: `sm` / `md` / `pill`）と px 値。
- **カード**: ギャラリー用（画像比率・角丸・ホバー時の Elevation 変化）。
- **フォーム**: 登録 review、エラー表示位置。
- **アイコン**: Bootstrap Icons のみ、装飾 vs 意味付き（ラベル併記）を Guidelines とリンク。

### Step H — 仕上げ

- Do / Don't を Guidelines に集約。
- 更新日・バージョン。
- （任意）主要ルート一覧は付録に短く。

---

## AI実装時に効く書き方（公式の意図に沿う）

- **具体値**: radius px、padding、shadow の blur/spread、hex は「固定ブランドのみ」または「Bootstrap 変数名」。
- **「テーマが変わったら」**: コンポーネントのルールは **「Bootstrap 変数に依存」＋「上書きは assets/styles.css のトークン」** と1行で書き、全テーマでも破綻しない指示にする。

---

## 本計画と以前案の差分

| 項目 | 以前案 | 本更新 |
|------|--------|--------|
| 章立て | 独自見出し中心 | **designmd.ai 公式6章＋最小の Product context** |
| テーマ | キュレーション検討 | **全件OK**。代わりに視認性目標と Elevation/形で統一感 |
| 可愛さ | ムード・色中心 | **角丸・ボタン・影（Elevation）** で定義 |

---

## 完了条件

- [DESIGN.md](c:\Users\ryone\Desktop\oshi-app\DESIGN.md) に **Colors / Typography / Spacing / Components / Elevation / Guidelines** がすべて実質内容を持ち、spec の技術スタックと矛盾しない。
- 「推し活らしさ」が **形・ボタン・影** のルールとして検索可能に書かれている。
- テーマ全件を前提に、**ダークの怪しい可愛さ** も Elevation/ボーダーのレンジで言語化されている。
