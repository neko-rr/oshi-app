<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# コンポーネント（shadcn）

## 正本

- ライブラリ: [shadcn/ui](https://ui.shadcn.com/)（本リポは `new-york` / CSS variables）  
- 設定: `apps/web/components.json`  
- 実装: `apps/web/src/components/ui/`  
- **アイコン:** [icons.md](icons.md) の lucide 一覧のみ  
- **色:** [themes.md](themes.md)（セマンティック変数。hex 直書き禁止）

新しい UI 部品が必要なら、まず shadcn に相当があるか確認し、あれば追加してから使う。  
ゼロから独自 Button を増やさない。未決の好みは [feedback/](feedback/) に pending で残す（skill `design-feedback`）。

## 使い方のルール

| Do | Don't |
|----|-------|
| `Button` / `Input` / `Card` 等の variants | ページごとに別デザインの生 `<button>` を増やす |
| `className` で余白・幅の調整 | その場限りの色クラスで primary を hex 上書き |
| セマンティック色（`bg-primary` 等） | `bg-[#9f606c]` のような直書き |

テーマを変えると **全部品のセマンティック色**が切り替わる前提で書く（todo-app 方式）。

## ボタン（variant）

| variant | 用途 |
|---------|------|
| `default` | **主 CTA・1画面1つ**（テーマの `primary`） |
| `secondary` | 副次アクション |
| `outline` | 一覧・フィルタ・ tertiary |
| `ghost` | ナビ・ツールバー・行内操作 |
| `destructive` | 削除等（確認必須） |

アイコン + ラベルでは **ラベルを主**。アイコンのみは `aria-label` + [icons.md](icons.md)（import は `@/lib/icons`）。

## 画面別の目安

| 画面 | 重視 |
|------|------|
| ギャラリー | 写真カード。情報は二次。タップ領域は広く |
| 登録 | 手順が上から下へ。主ボタンは1つ目立つ |
| 設定 | リスト＋短い説明。テーマは `/settings/theme`（トークン一式） |
| Auth | 落ち着いたフォーム。エラーは分かりやすく |

## カード

カードは **操作や情報のまとまりが必要なときだけ**。  
装飾だけのカード枠は増やさない（ヒーローや一覧の主役写真を枠で潰さない）。

## 未実装メモ

テーマ UI の見た目改善（スウォッチ等）は任意。適用範囲は常にトークン一式（[themes.md](themes.md)）。  
Lab 本決定後はここに **1〜2行** 追記 → [feedback/decisions.md](feedback/decisions.md)。
