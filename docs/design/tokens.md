<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# トークン（色・字・余白・角）

実装の名前は shadcn / Tailwind のセマンティック変数に合わせる。  
数値の最終確定は Design Lab 採用後に `colors.css` と同期する（フェーズ1以降）。  
**名前の正本:** [meta/tokens.json](meta/tokens.json)。検査: `python scripts/check_design_tokens.py`（値の自動生成はまだしない）。

## 色の3層

| 層 | 変えるもの | 数 | 誰が触る |
|----|------------|----|----------|
| シェル | 背景・本文・カード面など骨格 | 少数 | 設定で任意（普段は不要） |
| ブランド既定 | アプリの「最初の印象」の種 | 1 | 開発（[brand-palette.md](brand-palette.md)） |
| 推し色 | `primary` / `ring` などアクセント | **多数** | **顧客が簡単に選択** |

デザイン案比較では **配置・部品が先**。推し色は全案で入れる（用途最適でも省略しない）。  
詳細: [themes.md](themes.md) / [oshi-accents.md](oshi-accents.md) / [compare-workflow.md](compare-workflow.md)

## セマンティック名（実装と揃える）

| 変数（例） | 用途 |
|------------|------|
| `--background` / `--foreground` | 画面の地と本文 |
| `--card` / `--card-foreground` | カード面 |
| `--primary` / `--primary-foreground` | 主なボタン・強調（推し色の主戦場） |
| `--muted` / `--muted-foreground` | 補助テキスト・薄い面 |
| `--border` / `--input` / `--ring` | 線・入力・フォーカス |
| `--destructive` | 削除など危険操作 |

橋渡し: `apps/web/src/styles/tailwind-theme.css`  
生定義: `apps/web/src/styles/colors.css`

## タイポ・余白・角（方針のみ）

| 項目 | 方針 |
|------|------|
| 本文 | 読みやすいサンセリフ。日本語が欠けない行間 |
| 見出し | 本文より少し大きく。ブランド名を押しつぶさない |
| 余白 | 8px 系。ギャラリーは余白多め |
| 角 | 柔らかめ（sharp すぎない）。数値は Lab 後に固定 |
| タッチ | 主要操作は指で押しやすい大きさ |

## まだやらないこと

- ブランド色 `#9f606c` の 50〜950 全スケールの文書化（後回し）  
- 現行 `colors.css` の大量ダークテーマを正とする扱い（整理はフェーズ1以降）  
