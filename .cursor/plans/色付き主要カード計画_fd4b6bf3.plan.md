---
name: 色付き主要カード計画
overview: 全ページの主要カードを色付きカード中心へ移行するため、`DESIGN.md` の方針更新と `assets/styles.css`・主要ページのクラス適用を段階的に進める計画です。
todos:
  - id: design-card-policy
    content: DESIGN.md の Colors/Components/Guidelines を色付き主要カード方針へ更新
    status: completed
  - id: design-card-tokens
    content: 色付きカード用トークン（bg/text/border）を DESIGN.md に追加
    status: completed
  - id: css-card-variants
    content: styles.css に card-main-* 系クラスを追加し既存トークンと統合
    status: completed
  - id: migrate-home-register
    content: home + register 系の主要カードを色付きバリアントへ移行
    status: completed
  - id: migrate-gallery-settings
    content: gallery + settings の主要カードを色付きバリアントへ移行
    status: completed
  - id: card-exception-rules
    content: 入力/明細など中立カードを許可する例外ルールを DESIGN.md に追加
    status: completed
  - id: theme-qa-colored-cards
    content: 主要6画面でテーマ横断の可読性・視認性QAを実施
    status: completed
isProject: false
---

# 色付き主要カードへの移行計画

## 結論（質問への回答）

- **はい、`DESIGN.md` の書き換えは必要です。**
- 理由: 現在の `DESIGN.md` は「通常カード（`color-surface`）」中心の記述が主で、色付きカードを“主要”とする設計原則が十分に明文化されていないため。

対象ファイル:
- [DESIGN.md](c:\Users\ryone\Desktop\oshi-app\DESIGN.md)
- [assets/styles.css](c:\Users\ryone\Desktop\oshi-app\assets\styles.css)
- 主要UI実装（`className="card-custom"` / `className="card ..."` を持つページ・features）

## Step 1: DESIGN.md のカード方針を「色付き主軸」に再定義

`Components > Cards` と `Colors` を更新し、カードの優先順位を明確化する。

- カード種別を 3 層に分ける:
  - **PrimarySurfaceCard**（主要情報）: `bg-primary` 系
  - **SecondarySurfaceCard**（補助情報）: `bg-secondary` / 中立色
  - **NeutralCard**（入力補助・背景分離用）: 従来の白系
- 「どの画面でどの種別を主に使うか」を Appendix へ追記
- コントラスト要件を追記（`text-white` 必須条件など）

## Step 2: 色付きカードのトークンを追加

`DESIGN token` を追加し、Bootswatch 全テーマで再利用可能にする。

- 追加トークン例:
  - `card-primary-bg`, `card-primary-text`, `card-primary-border`
  - `card-secondary-bg`, `card-secondary-text`
  - `card-info-bg`, `card-success-bg`, `card-warning-bg`, `card-danger-bg`
- 「背景色と文字色のセット運用」をルール化（片方だけ変更を禁止）

## Step 3: styles.css にカードバリアントを実装

`assets/styles.css` に共通クラスを追加。

- `.card-main-primary`
- `.card-main-secondary`
- `.card-main-info`
- `.card-main-success`
- `.card-main-warning`
- `.card-main-danger`

実装方針:
- `border-radius`, `shadow`, `focus-visible` は既存トークンを再利用
- 白系 `card-custom` は残すが「主要用途からは外す」

## Step 4: 全ページの主要カードを段階変換

`rg` で見えている主要箇所から順に、主要カードを色付きへ置換。

優先順:
1. `pages/home.py`
2. `pages/register/*` + `features/review/components.py`
3. `pages/gallery/index.py`, `pages/gallery/detail.py`
4. `pages/settings/index.py`

変換ルール:
- セクション先頭/重要サマリー/主要CTA周辺カードを色付きへ
- 入力フォーム本体カードは可読性優先で必要に応じて中立色維持

## Step 5: 例外ルール（読みにくさ防止）

色付き主軸でも、次は例外として中立カード可。

- 長文入力フォーム
- 明細テーブル
- 画像比較が主目的の領域

この例外を `DESIGN.md` の Do/Don't に明記する。

## Step 6: テーマ横断QA

最低確認画面:
- `/`
- `/register/barcode`
- `/register/photo`
- `/register/review`
- `/gallery`
- `/settings`

確認観点:
- 色付き主要カードが「主要情報」として一目で分かる
- 文字コントラスト（特に warning/success）
- 下部ナビと競合せず、視認ノイズが強すぎない

## 実装順（推奨）

1. `DESIGN.md` 方針更新
2. `styles.css` カードバリアント追加
3. 画面ごとの class 置換
4. テーマ横断確認
5. 微調整（warning/info の文字色や濃度）

## 完了条件

- `DESIGN.md` に「色付きカードを主要カードとする」方針と例外が明記されている
- 全主要ページで主要カードが色付きに統一されている
- Bootswatch 複数テーマ（Minty 含む）で可読性が担保される