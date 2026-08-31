---
name: design-mobile
description: >-
  Expo / apps/mobile の見た目・トークン・推し色・アイコンを Web デザイン体制に揃えるとき。
  モバイル着手前・UI 実装前に適用する。
---

# design-mobile（Expo × デザイン連携）

## いつ使うか

- `apps/mobile` に画面・テーマ・アイコンを足す直前
- Web の推し色／トークンをモバイルに持ち込む相談
- `lucide-react-native` を入れるとき

配置枠だけの README 更新だけなら不要。

## 着手前（必須）

1. skill **`official-docs-first`**（Expo / Supabase mobile）  
2. `.cursor/rules/mobile.mdc` / `auth.mdc` / `security.mdc`  
3. デザイン正本: `docs/design/README.md` + `meta/tokens.json` + `oshi-accents.md`  
4. a11y が絡むなら **`design-a11y`**（公式 WebFetch）

## 契約（Web と揃える）

### セマンティック・トークン

| 項目 | 内容 |
|------|------|
| 名前 | `docs/design/meta/tokens.json` の `required_semantic` と同じ意味 |
| 検査 | `python scripts/check_design_tokens.py`（Web CSS）。モバイル実装時も **同名** を使う |
| 値 | まだ Web `colors.css` が正。モバイルは Theme オブジェクト等へ写経 |

### 推し色

| 項目 | 内容 |
|------|------|
| 用途 | アプリ見た目のアクセント（`--primary` / ring 相当） |
| カラータグ | **別**（製品ラベル。枠数変更禁止） |
| API | 将来 `theme_settings` 等。キー案: `oshi_accent`（hex or token id）、`members_id`。実装前に `api_contract` + `product-spec-sync` |
| UX | スウォッチ選択・多数可（`oshi-accents.md`） |

### アイコン

| 項目 | 内容 |
|------|------|
| 正本 | `docs/design/meta/icons.json` |
| Web | `apps/web/src/lib/icons.ts` ← `lucide-react` |
| Mobile | `apps/mobile/src/lib/icons.ts` ← `lucide-react-native` |
| 同期 | `python scripts/sync_design_icons.py`（両方生成） |
| 依存 | Expo 着手時に `lucide-react-native` を `apps/mobile` へ追加 |

## 実行チェックリスト

- [ ] Cookie / Next middleware に依存していない（Bearer + SecureStore）  
- [ ] secret / service_role をバンドルしていない  
- [ ] トークン名が Web と食い違っていない  
- [ ] アイコンは `apps/mobile/src/lib/icons.ts` から named import  
- [ ] 推し色とカラータグを混ぜていない  
- [ ] 大きな見た目は Web Lab 方針を参照（モバイル専用4列比較は不要。必要なら Lab の mobile-app プレビュー）  
- [ ] **セーフエリア**（ノッチ／ホームバー）を考慮する。Lab のセーフエリア線（fb-001）が未実装なら、実機／`safe-area-inset` で確認  

## 後回し（Lab）

- Design Lab の **セーフエリア（ノッチ）線**（fb-001 / deferred）— アプリ枠が本番寸法に近くなってから実装

## やらないこと

- Web と別のアイコンセットを増やす  
- モバイルだけ全面ピンク等の決め打ち  
- 本番 Web を触らずに「モバイルだけ別ブランド」を正にする  

## 関連

- `mobile.mdc` / `design.mdc`  
- icons: `sync_design_icons.py`  
- tokens: `check_design_tokens.py`  
- gaps: `generate_design_docs.py`  
