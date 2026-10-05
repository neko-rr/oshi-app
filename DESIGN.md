# DESIGN（v2 入口）

**製品:** Oshihaven（[https://oshihaven.com](https://oshihaven.com)）。マスコット IP は風ねこ / Kaze Neko。  
**正本は [docs/design/README.md](docs/design/README.md)。** このファイルは薄い入口だけ。

## 何を決めているか

| 層 | 内容 |
|----|------|
| 1 | **UI/UX・配置・部品** — shadcn ベース、Lab で3案比較。形・質感・タイポ・階層・感情予算は [principles.md](docs/design/principles.md) / [tokens.md](docs/design/tokens.md) |
| 2 | **色** — テーマでセマンティック変数 **一式**を切替（[todo-app](https://github.com/neko-rr/todo-app) 方式）。既定は緑系 `default`。画面に hex 直書き禁止。トーン強度（落ち着き／推し活フル）は色パックと別軸 |
| 3 | **動き** — 短い有用な反応は残す。長い演出・本線の遊び尽くしはしない（[motion.md](docs/design/motion.md)） |
| 4 | **スマホ Web（店頭）** — 下部タブ・写真 fit・隣スワイプ・短い成功／再試行（[web-phone-ux.md](docs/design/web-phone-ux.md)） |
| 5 | **蓄積** — 要望は **pending 可** → 採用分だけ docs にルール化 |
| 6 | **a11y** — WCAG 2.2 AA 目標。最新は公式を WebFetch（skill `design-a11y`） |
| 7 | **対象トーン** — 20〜30代・大人のお洒落かわいい推し活。コピーは [voice.md](docs/design/voice.md)。マスコットはくらげ画風（jelly-nuance）×庇護欲 — [mascot-asset-brief.md](docs/design/mascot-asset-brief.md)。**色や絵文字で「女性向け」にするな** |

**カラータグ（製品ラベル）とテーマ色は別。** カラータグ枠数は勝手に変えない。  
「primary/ring だけ差し替え」は **誤り**（正は [themes.md](docs/design/themes.md)）。

## 読む順

1. [docs/design/README.md](docs/design/README.md)  
2. 原則 → [principles.md](docs/design/principles.md)  
3. ボイス・コピー → [voice.md](docs/design/voice.md)  
4. テーマ → [themes.md](docs/design/themes.md)  
5. 動き → [motion.md](docs/design/motion.md)  
6. スマホ Web（店頭） → [web-phone-ux.md](docs/design/web-phone-ux.md)  
7. 部品 → [components.md](docs/design/components.md) / アイコン → [icons.md](docs/design/icons.md) / マスコット → [mascot-asset-brief.md](docs/design/mascot-asset-brief.md)（指針）・[mascots.md](docs/design/mascots.md)（運用）  
8. カラータグ境界 → [oshi-accents.md](docs/design/oshi-accents.md)  
9. 比較 → [compare-workflow.md](docs/design/compare-workflow.md)  
10. **要望・未決** → [feedback/README.md](docs/design/feedback/README.md)  
11. **a11y** → [a11y.md](docs/design/a11y.md)  

## 開発者向け

| やること | どこ |
|----------|------|
| 3案比較（dev のみ） | `/dev/design-lab` — skill **`design-lab`** |
| Lab 案を画面単位で本番へ | skill **`design-adoption`** + `meta/design_adoption.json` |
| 一般の本番 UI 変更 | skill **`design-change`** |
| 「ここ気になる」を残す | [feedback/inbox.md](docs/design/feedback/inbox.md) — skill **`design-feedback`** |
| コントラスト・フォーカス等 | skill **`design-a11y`**（公式 WebFetch） |
| 規約検査 | `pnpm check:design` / `pnpm check:design-tokens` |
| as-built gaps | `pnpm generate:design-docs` → `docs/design/generated/gaps.md` |
| 実装トークン | `apps/web/src/styles/colors.css` / `tailwind-theme.css` |
| トークン名正本 | `docs/design/meta/tokens.json` |
| shadcn 部品 | `apps/web/src/components/ui/` |
| アイコン正本 | `docs/design/meta/icons.json` → `pnpm sync:design-icons`（Web + mobile） |

## Cursor

- ルール: `.cursor/rules/design.mdc` / `mobile.mdc`  
- Skills: `design-feedback` → `design-lab` → `design-adoption` / `design-change` / `design-a11y` / `design-mobile`  
- 手/自動の見分け: [docs/README.md](docs/README.md)  

旧 Dash / Bootswatch / archive の DESIGN 計画は **新規の正にしない**。
