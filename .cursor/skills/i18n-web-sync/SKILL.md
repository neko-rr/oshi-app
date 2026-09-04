---
name: i18n-web-sync
description: >-
  apps/web/messages の ja 正本に合わせて en 下書きを同期するときに適用する。
  文言キー追加・改名・欠落、ja.json 変更の直後。
---

# Web i18n 同期（ja → en 下書き）

## いつ使うか

- `apps/web/messages/ja.json` を追加・改名・削除したとき
- 画面文言をキー化した直後
- en が古い／キー欠落の疑いがあるとき

文言を触らない UI だけの変更なら不要。法務英語の**人レビュー本体**は [i18n_legal_en.md](../../../docs/product/i18n_legal_en.md) の流れに従う（この skill は下書き＋注記まで）。

## 正本

| 何 | どこ |
|----|------|
| 日本語（正本） | `apps/web/messages/ja.json` |
| 英語 | `apps/web/messages/en.json` |
| 推し活・製品語 | `docs/product/i18n_glossary.md` |
| 方針 | `docs/product/i18n.md` |
| キー検査 | `scripts/check_i18n_message_keys.py` |

## 手順（必須）

1. 差分把握

```powershell
python scripts/check_i18n_message_keys.py
```

2. **正本は ja**。欠落キーだけ `en.json` に下書き追加する  
   - 既存の良い英訳は勝手に書き換えない  
   - ja の意味が変わったキーのみ更新を提案する  
3. [`docs/product/i18n_glossary.md`](../../../docs/product/i18n_glossary.md) の用語を優先適用  
4. 下書き後に再度キー検査を緑にする  

```powershell
python scripts/check_i18n_message_keys.py
```

5. **コミットしない**（ユーザー依頼があるまで）  
6. **CI／スクリプトで en を自動生成・上書きしない**（検査のみ）  
7. Privacy 等の法務文は「下書き＋要人レビュー」と注記する（レビュー本体は別途）

## 禁止

- ja を正にせず en だけを増やす
- 用語集を無視した場当たり訳の量産
- CI や hook での機械上書きコミット

## 完了後

- [ ] `check_i18n_message_keys.py` が緑
- [ ] 用語集と矛盾する訳がない（矛盾時は用語集か en を人が決める）
- [ ] 法務文があればレビュー待ちと明示
- [ ] 秘密を messages に入れていない

## 関連

- skill `post-change-verify`（Web 節にキー検査あり）
- skill `product-spec-sync`（受け入れ・feature_status を触るとき）
