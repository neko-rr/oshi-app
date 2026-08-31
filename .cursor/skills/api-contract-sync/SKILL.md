---
name: api-contract-sync
description: >-
  packages/shared の API_PATHS と FastAPI ルータのパスずれを検知するときに適用する。
  共有定数追加・ルータ追加・パス改名・API 契約確認のとき。
---

# API 契約同期（shared ↔ FastAPI）

## いつ使うか

- `packages/shared/src/index.ts` の `API_PATHS` を追加・改名・削除
- `apps/api/app/routers/` にルートを追加・パス変更
- Web / Mobile が呼ぶパスと API 実装が食い違う疑いがあるとき
- `product-spec-sync` の前後で契約だけ先に固めたいとき

文言のみ・docs のみなら不要。

## 正本

| 何 | どこ |
|----|------|
| 共有パス定数 | `packages/shared/src/index.ts` → `API_PATHS` |
| FastAPI ルート | `apps/api/app/routers/*.py`（`APIRouter` + デコレータ） |
| ワイヤ規約 | `.cursor/rules/api_contract.mdc`（snake_case / Bearer / エラー形） |
| as-built（参考） | `docs/product/generated/shared_paths.md` / `api_routes.md` / `gaps.md` |

**クライアントが使うパスは shared に置き、ルータと一致させる。**  
API にしか無い内部ルートを全部 shared に載せる必要はない（片方向: shared ⊆ API）。

## 着手前

1. 新パス・識別子なら skill `new-file-naming`
2. 振る舞い変更なら `tdd-workflow`
3. JSON キーは **snake_case**。`members_id` をクエリでなりすまし可能にしない

## 検査（必須）

```powershell
python scripts/check_api_contract_sync.py
```

- exit 0: `API_PATHS` の各 path に対応する FastAPI ルートがある
- exit 1: `shared_not_in_api` — 定数だけ存在／パス不一致

親プレフィックス一致（例: shared `/products` と API `/products/{id}`）は許容。

## 直し方

1. どちらかを正に決める（通常は **ルータの実パス**）
2. `API_PATHS` または `@router.*` を揃える
3. Web / Mobile の呼び出しを追随
4. 再実行: `python scripts/check_api_contract_sync.py`
5. ルート変更なら `python scripts/generate_product_docs.py`（as-built）
6. `post-change-verify`

## 完了後

- [ ] `check_api_contract_sync.py` が緑
- [ ] 必要なら product generated を更新
- [ ] `api_contract.mdc`（Bearer / エラー形）に反していない
- [ ] 秘密をテストやログに出していない

## 関連

- skill `product-spec-sync` / `tdd-workflow` / `post-change-verify`
- 生成ロジック共有: `scripts/generate_product_docs.py`（scan / gaps）
