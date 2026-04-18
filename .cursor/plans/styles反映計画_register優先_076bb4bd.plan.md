---
name: styles反映計画_register優先
overview: "`DESIGN.md` の最新ルールに合わせ、まずは登録画面（`/register/barcode`, `/register/photo`, `/register/review`）のみを対象に、`assets/styles.css` の safe-area / focus-visible / 再試行UIスタイルを段階的に反映する計画です。"
todos:
  - id: register-token-foundation
    content: styles.css 先頭に DESIGN準拠トークン（border/shadow/focus/safe-area）を追加
    status: completed
  - id: register-focus-visible
    content: 入力/ボタンの focus-visible を固定青からテーマ依存リングへ移行
    status: completed
  - id: register-safe-area
    content: page-container と step-actions の下部余白に safe-area を反映
    status: completed
  - id: register-retry-ui
    content: 登録画面用 retry-panel / retry-actions / btn-retry などの見た目ルールを追加
    status: completed
  - id: register-state-spec
    content: 登録画面で使うボタン・入力・カードに状態別スタイルを適用
    status: completed
  - id: register-theme-qa
    content: register 3画面で safe-area / focus / retry視認性を確認するチェック手順を準備
    status: completed
isProject: false
---

# assets/styles.css 反映計画（登録画面のみ）

## 対象とゴール

- 対象画面: `/register/barcode`, `/register/photo`, `/register/review`
- 対象ファイル:
  - [DESIGN.md](c:\Users\ryone\Desktop\oshi-app\DESIGN.md)
  - [assets/styles.css](c:\Users\ryone\Desktop\oshi-app\assets\styles.css)
- ゴール:
  - `DESIGN.md` の mobile-first 要件に沿って、safe-area / focus-visible / 再試行UIの見た目を統一
  - 既存テーマ（Bootswatch 全件）で破綻しない CSS ルールを先に固める

## Step 1: DESIGNトークンをCSSカスタムプロパティに定義

`assets/styles.css` の先頭に `:root` 相当の設計トークンを追加し、既存クラスが参照できる土台を作る。

- 追加候補:
  - `--app-surface-border: 1px solid var(--bs-border-color);`
  - `--app-shadow-1: 0 2px 8px rgba(0,0,0,.08);`
  - `--app-shadow-2: 0 8px 24px rgba(0,0,0,.18);`
  - `--app-focus-ring-color: var(--bs-primary);`
  - `--app-focus-ring-width: 2px;`
  - `--app-focus-ring: 0 0 0 var(--app-focus-ring-width) color-mix(in srgb, var(--app-focus-ring-color) 35%, transparent);`
  - `--app-safe-bottom: env(safe-area-inset-bottom, 0px);`

目的: `DESIGN.md` のトークン方針を CSS で再利用可能にする。

## Step 2: safe-area を登録画面導線に反映

登録画面の主要コンテナ/アクション領域に safe-area 余白を反映する。

- 対象クラス（既存）:
  - `.page-container`
  - `.step-actions`
  - 必要に応じて登録用の下部固定要素クラス（存在時）
- 反映内容:
  - `padding-bottom` に `var(--app-safe-bottom)` を加算
  - 下部ナビと干渉しない余白を保証

## Step 3: focus-visible をテーマ依存で統一

固定青の focus 表現を廃止し、`DESIGN.md` の focus ルールへ統一する。

- 対象クラス:
  - `.input-custom:focus`（既存の固定RGBAを置換）
  - 登録画面で使うボタン系セレクタ（`button`, `.btn`, 必要なクラス）
- 反映内容:
  - `:focus-visible` 優先でリング表示
  - マウス操作とキーボード操作の見え方を分離

## Step 4: 再試行UI（登録画面のみ）の見た目ルールを追加

登録フロー失敗時の再試行導線を視認しやすくするスタイルを追加。

- 新規クラス案:
  - `.retry-panel`（失敗メッセージと操作をまとめる面）
  - `.retry-title`, `.retry-message`
  - `.retry-actions`
  - `.btn-retry`（Primary寄り）
  - `.btn-fallback`（手入力へ進む等）
- デザイン要件:
  - `surface-border + shadow-1` で背景と分離
  - 再試行ボタンを最優先視認
  - 失敗文言は色だけに頼らずアイコン/文言併用

## Step 5: 登録画面向け状態別スタイルを整理

`default / hover / active / focus-visible / disabled / error` を登録画面コンポーネントへ適用。

- 対象:
  - ボタン（再試行・次へ・スキップ）
  - 入力欄（手入力）
  - カード（レビュー表示）
- 目的:
  - 外出先の片手操作でも状態の違いが瞬時に判断できること

## Step 6: テーマ横断の確認手順（登録画面のみ）

最低限の目視確認シナリオを先に固定する。

- 検証ページ:
  - `/register/barcode`
  - `/register/photo`
  - `/register/review`
- 検証観点:
  - safe-area で下部要素が欠けない
  - focus-visible がテーマに応じて見える
  - 再試行UIが背景に埋もれない
  - ダークテーマでもカード境界が判別できる

## 実装順（次フェーズ）

1. Step 1（トークン定義）
2. Step 3（focus-visible統一）
3. Step 2（safe-area反映）
4. Step 4（再試行UI追加）
5. Step 5（状態別調整）
6. Step 6（登録画面で確認）