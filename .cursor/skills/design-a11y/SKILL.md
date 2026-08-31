---
name: design-a11y
description: >-
  アクセシビリティ・コントラスト・フォーカス・モーション・タップ領域を触る前に適用する。
  公式 WCAG / WAI / MDN を WebFetch し、記憶だけに頼らない。
---

# design-a11y（アクセシビリティ・最新公式確認）

## いつ使うか（必須）

次のいずれかを **実装・トークン変更する直前**:

- 推し色 / primary / テキスト色のコントラスト
- フォーカスリング・モーダル・オーバーレイ
- モーション（`prefers-reduced-motion` 含む）
- タップ領域・アイコンのみボタン・aria-label
- Lab 採用を本番へ落とすとき（`design-adoption` と併用）

文言だけ・icons.json の追記だけなら不要。

## 最新情報の取り方（ここが本体）

**ローカル `a11y.md` だけで仕様判断するな。** 毎回（またはセッション初回）公式を取る。

1. 索引を開く: `docs/refs/official-links.md` → 「アクセシビリティ・UX」  
2. 用途に応じて **WebFetch**（最低1本、推奨2本）:

| 用途 | 優先 URL |
|------|----------|
| 基準全体 | https://www.w3.org/TR/WCAG22/ |
| 2.2 の新基準 | https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ |
| 概要・バージョン | https://www.w3.org/WAI/standards-guidelines/wcag/ |
| コントラスト | https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast |
| reduced-motion | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion |
| フォーカス | https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html |

3. 取得内容を **3〜5行で要約**し、今回の変更への影響を書く  
4. プロジェクト要約 `docs/design/a11y.md` と矛盾するなら **公式を優先**し、`a11y.md` 更新案を出す（人の承認後）  
5. 続けて実装（`design-change` / `design-adoption`）

## 最低ライン（実装チェック）

- [ ] 主 CTA・本文のコントラストを確認した（推し色変更時）  
- [ ] focus-visible を潰していない  
- [ ] アイコンのみ操作に `aria-label`  
- [ ] 装飾モーションは `prefers-reduced-motion` で切れる  
- [ ] エラーを色だけに依存していない  
- [ ] 目標は **WCAG 2.2 AA**（現行 Recommendation）

## やらないこと

- 「前に WCAG 2.1 で十分と言った」だけで 2.2 を無視する  
- ブログ二次記事だけを正にする（必ず W3C / MDN を含む）  
- コントラスト未確認で本番全面採用  

## 関連

- 要約: `docs/design/a11y.md`  
- 索引: `docs/refs/official-links.md`  
- 公式優先の兄弟: skill `official-docs-first`  
- Lab: `design-lab` / 本番反映: `design-adoption`  

## 委譲

公式 WebFetch・要約は **Task(generalPurpose / explore) に委譲可**。コントラスト採用などの **判断は親**。表: `AGENTS.md`「Skill → Task / サブエージェント」。
