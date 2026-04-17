---
name: DESIGN改善計画
overview: 現行 `DESIGN.md` と `assets/styles.css` を照合し、推し活らしい可愛さを維持しながら、全テーマで視認性・一貫性・実装可能性を高めるための段階計画です。
todos:
  - id: token-granularity
    content: Colors/Elevation の補助トークン（focus/border/shadow/hover）を DESIGN.md に追加する
    status: completed
  - id: bg-surface-rules
    content: 背景とカードの分離ルールを判定可能な数値・必須条件に変更する
    status: completed
  - id: state-spec
    content: Buttons/Cards/Form の状態別ルール（default-hover-active-focus-disabled-error）を追加する
    status: completed
  - id: oshi-intensity
    content: 画面ごとの可愛さ強度と表現手段（形・影・余白）を Appendix に追記する
    status: completed
  - id: type-readability
    content: 本文/注釈/数値の最小サイズ・行間・情報密度ガイドを補強する
    status: completed
  - id: design-css-mapping
    content: DESIGN token と styles.css クラスの対応章を追加する
    status: completed
  - id: theme-qa-split
    content: Theme QA を可読性・操作性・世界観の3カテゴリに再編する
    status: completed
isProject: false
---

# DESIGN.md 改善計画（推し活グッズアプリ）

## 先に直すべき観点

- `DESIGN.md` は方針が整っている一方、**CSS実装へ落とすためのトークン命名と最低値**が不足している。
- `assets/styles.css` では `body` 背景が未定義で、`var(--bs-body-bg)` と `var(--bs-card-bg)` が近いテーマで同化しやすい。
- フォーカスリングが固定青 (`rgba(13, 110, 253, 0.25)`) になっており、テーマ依存方針とずれる。
- ボタン/カードの状態差（default/hover/active/disabled）が DESIGN 側で十分に定義されていない。

参照:
- [DESIGN.md](c:\Users\ryone\Desktop\oshi-app\DESIGN.md)
- [assets/styles.css](c:\Users\ryone\Desktop\oshi-app\assets\styles.css)
- [.cursor/rules/spec.md](c:\Users\ryone\Desktop\oshi-app\.cursor\rules\spec.md)
- [.cursor/rules/file_structure.md](c:\Users\ryone\Desktop\oshi-app\.cursor\rules\file_structure.md)

## Step 1: トークンを「実装可能な粒度」に再定義

- `DESIGN.md` の `Colors` に、CSS で直接使う補助トークンを追加する。
  - 例: `surface-border-default`, `surface-shadow-1`, `focus-ring-color`, `focus-ring-width`, `interactive-hover-bg`
- 各トークンの「意味」「使う場所」「最低条件」を明記する。
- 目的: AI/開発者が実装時に迷わない状態にする。

## Step 2: 背景とカードの分離基準を数値化

- 既存の「分離ルール（必須）」を、判定可能な基準にする。
  - 例: 「背景とカードが近色の場合、`1px border + Level1 shadow` を必須」
  - 例: 「主要コンテンツカードは `border` なし禁止（近色テーマ時）」
- QA項目を「主観」から「チェック可能条件」に変える。

## Step 3: インタラクション状態を Components に追加

- `Buttons`, `Form Controls`, `Cards` に状態定義を追加。
  - default / hover / active / focus-visible / disabled / error
- 特に `focus-visible` をテーマ依存色で定義し、固定青依存を避ける。
- 目的: アクセシビリティと統一感の両立。

## Step 4: 推し活らしさの表現を運用ルール化

- 可愛さを「色」より「形・影・密度」で管理する現在方針を、ページ単位に具体化。
  - 登録系: 行動重視でシンプル
  - ギャラリー系: 余白広め + カード演出
  - 設定系: 情報優先で装飾抑制
- `Appendix` に「画面ごとの可愛さ強度」を追記（高/中/低）。

## Step 5: タイポと可読性の実運用基準を補強

- 日本語本文・注釈・数値の「最小サイズ」「行間」「最大行長（目安）」を追記。
- 「注釈は 0.875rem 未満禁止」に加え、カード内での情報密度上限（1ブロック行数目安）を定義。

## Step 6: styles.css 反映に向けたマッピング章を追加

- `DESIGN.md` の末尾に「実装マッピング」短章を追加。
  - `DESIGN token -> CSS variable/class` の対応
  - 対象クラス: `.card-custom`, `.photo-card`, `.stat-box`, `.input-custom`, `.theme-card`
- 目的: Next.js/FastAPI へ移行してもデザイントークンを引き継げるようにする。

## Step 7: テーマ横断 QA の運用を定着

- `Theme QA Checklist` を3カテゴリに分割。
  - 可読性（文字・境界）
  - 操作性（タップ/フォーカス/状態差）
  - 世界観（可愛さの一貫性）
- 最低検証画面を固定: `/register/review`, `/gallery`, `/settings`。

## 優先度順（実施順）

1. Step 1（トークン粒度）
2. Step 2（背景/カード分離の数値化）
3. Step 3（状態定義）
4. Step 7（QA再編）
5. Step 4（可愛さ運用）
6. Step 5（タイポ補強）
7. Step 6（実装マッピング）

## 完了条件

- `DESIGN.md` だけ読めば、背景とカード同化問題を再発させない実装が可能。
- `assets/styles.css` の主要クラスをトークンで置き換える設計指示が揃っている。
- 全テーマ許容のまま、視認性と推し活らしさの両立条件が明文化されている。