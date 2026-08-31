---
name: design-adoption
description: >-
  Design Lab で人が選んだ案を本番画面へ部分採用するときに適用する。
  一括リデザイン禁止。画面単位で decisions / design_adoption を更新する。
---

# design-adoption（Lab → 本番）

## いつ使うか（必須）

- Lab（`/dev/design-lab`）で **人が案 A/B/C を本決定したあと**
- 「ギャラリーだけ B」「登録だけ A」など **画面単位の反映**
- `docs/design/meta/design_adoption.json` の status を進めるとき

Lab 比較中だけの変更は `design-lab`。要望の pending 記録は `design-feedback`。

## 正本

| 何 | どこ |
|----|------|
| 採用状態 | `docs/design/meta/design_adoption.json` |
| 決定ログ | `docs/design/feedback/decisions.md` |
| 原則・部品 | `docs/design/principles.md` / `components.md` |
| a11y | skill **`design-a11y`** + `docs/design/a11y.md` |
| 検査 | `python scripts/check_design_compliance.py` |

## フロー

```
人の本決定（案ID + 対象画面）
  → design-a11y（色・フォーカス・動きが絡むとき）
  → 対象画面だけ本番コード更新（一括禁止）
  → design_adoption.json 更新
  → decisions.md に1行
  → check_design_compliance + post-change-verify
```

## 実行手順

1. 採用内容を1行で固定（例: `/gallery` ← Lab **B**）  
2. `design_adoption.json` の該当画面を確認（無いなら追加）  
3. 色・コントラストが絡むなら **`design-a11y`**（公式 WebFetch）  
4. **対象ルートだけ** `apps/web/src/app/...` を更新。Lab CSS を本番へ無差別コピーしない  
5. shadcn + トークン経由。hex 直書き・lucide 直 import 禁止  
6. `design_adoption.json`: `lab_variant` / `status`（`partial` → `adopted`）/ `updated_at`  
7. `feedback/decisions.md` に1行  
8. `python scripts/check_design_compliance.py`  
9. `python scripts/generate_design_docs.py`（gaps / adoption_status 更新）  
10. skill `post-change-verify`

## status 語彙

| status | 意味 |
|--------|------|
| `not_started` | まだ本番に載せていない |
| `partial` | 一部要素だけ採用 |
| `adopted` | その画面の採用完了（以後は通常 `design-change`） |
| `deferred` | 後回し |

## 禁止

- Lab 未決定のまま本番全体を差し替える  
- 全画面一括リデザイン  
- pending の feedback を採用扱いにする  
- カラータグ仕様を Lab 採用ついでに変える  
- A を「推し色なし」にして本番へ落とす  

## 関連

- 比較: `design-lab`  
- 一般 UI: `design-change`  
- a11y: `design-a11y`  
- 要望: `design-feedback`  
