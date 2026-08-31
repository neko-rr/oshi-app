# DESIGN（v2 入口）

**正本は [docs/design/README.md](docs/design/README.md)。** このファイルは薄い入口だけ。

## 何を決めているか

| 層 | 内容 |
|----|------|
| 1 | **UI/UX・配置・部品** — shadcn ベース、Lab で3案比較 |
| 2 | **色** — ブランド種 `#9f606c` + 顧客 **推し色**（シェル全面塗替えにしない） |
| 3 | **蓄積** — 要望は **pending 可** → 採用分だけ docs にルール化 |
| 4 | **a11y** — WCAG 2.2 AA 目標。最新は公式を WebFetch（skill `design-a11y`） |

**カラータグ（製品ラベル）と推し色は別。** カラータグ枠数は勝手に変えない。

## 読む順

1. [docs/design/README.md](docs/design/README.md)  
2. 原則 → [principles.md](docs/design/principles.md)  
3. 部品 → [components.md](docs/design/components.md) / アイコン → [icons.md](docs/design/icons.md)  
4. 推し色 → [oshi-accents.md](docs/design/oshi-accents.md)  
5. 比較 → [compare-workflow.md](docs/design/compare-workflow.md)  
6. **要望・未決** → [feedback/README.md](docs/design/feedback/README.md)  
7. **a11y** → [a11y.md](docs/design/a11y.md)  

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
