<!-- 更新: 自動フォルダの説明 — 中身の生成物は手編集禁止。凡例: docs/README.md -->
# generated（製品 as-built）

`scripts/generate_product_docs.py` が出力する。**手編集禁止。**

| ファイル | 内容 |
|----------|------|
| `web_routes.md` | App Router の page / route |
| `api_routes.md` | FastAPI ルータ静的抽出 |
| `api_openapi.md` | OpenAPI パス一覧（人間向け） |
| `openapi.asbuilt.json` | OpenAPI 3（機械可読） |
| `shared_paths.md` | `packages/shared` の `API_PATHS` |
| `services.md` | `apps/api/app/services/*_service.py` |
| `gaps.md` | feature_status ↔ as-built の差分 |
| `inventory.json` | 機械可読の一覧 |

再生成:

```powershell
python scripts/generate_product_docs.py
```

`openapi.asbuilt.json` は可能なら FastAPI `app.openapi()`、だめなら静的抽出。
