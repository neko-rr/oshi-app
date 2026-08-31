---
name: product-spec-sync
description: >-
  製品仕様（docs/product）・画面/API ルート・機能ステータスを触る前後に適用する。
  機能追加、フロー変更、roadmap / feature_status / acceptance 更新、as-built 再生成のとき必須。
---

# 製品仕様同期（oshi_app）

## いつ使うか（必須）

- `docs/product/`（value / roadmap / flows / acceptance / meta）の変更
- Web の `page.tsx` / `route.ts` 追加・削除・パス変更
- API routers / `packages/shared` の `API_PATHS` / `*_service.py` の追加
- 「仕様にあるから実装する」判断の直前

## 正本マップ

| 何 | どこ |
|----|------|
| 顧客価値 | `docs/product/value.md` |
| ロードマップ | `docs/product/roadmap.md` |
| 登録フロー | `docs/product/flows/register.md` |
| 受け入れ条件 | `docs/product/acceptance/` |
| ステータス語彙 | `docs/product/meta/status_vocabulary.md` |
| 機能ステータス | `docs/product/meta/feature_status.json` |
| as-built | `docs/product/generated/`（**手編集禁止**） |
| **手/自動の見分け** | **`docs/README.md`** |
| 命令 | `.cursor/rules/spec.mdc` |
| 入口 | `docs/product/README.md` |

## 着手前

1. 更新区分が曖昧なら `docs/README.md`（**手**だけ人が直す。`generated/` は触るな）
2. `value.md` / `roadmap.md` / `status_vocabulary.md` でフェーズと語彙を確認する
3. `deferred` / `planned` を勝手に大規模実装しない（ユーザー承認）
4. 該当すれば `acceptance/*.md` の DoD を読む
5. ARCHIVE（旧 Dash）や Spec Kit を正にしない
6. 振る舞い変更なら `tdd-workflow`

## 実行手順

1. 意図を更新（flows / acceptance / roadmap / feature_status）— 承認後
2. コードを実装（業務は `apps/api` services）
3. **as-built 再生成（必須）**

```powershell
python scripts/generate_product_docs.py
```

4. `generated/gaps.md` を見る。特に:
   - `missing_expected_web` / `missing_expected_api`
   - `unexpected_web_route` / `unexpected_api_route`（planned/deferred なのに実装）
   - `missing_file` / `shared_not_in_api`
5. `post-change-verify`（該当時は `secure-change-checklist`）

## 完了後チェック

- [ ] `generate_product_docs.py` を実行した
- [ ] `generated/` を手編集していない
- [ ] `feature_status` の status が語彙どおり実態に合う
- [ ] `acceptance` DoD を満たしたなら status を上げた（またはまだ partial）
- [ ] `deferred` 機能のルートを勝手に足していない
- [ ] 秘密を出していない

## 関連

- DB は別系統: skill `db-schema-change` / `docs/db/`
- 変更後検証: `post-change-verify`
