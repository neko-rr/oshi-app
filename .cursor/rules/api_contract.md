# API 契約（FastAPI）

Apply Mode: Always Apply

詳細は [docs/migration/v2/rules/api_contract.md](../../docs/migration/v2/rules/api_contract.md) を正とする。

## 要約

- JSON は **snake_case**
- 保護 API は `Authorization: Bearer`
- 公開は `/health`
- エラー形: `{ "error": { "code", "message", "details?" } }`
- 初期: `/health`, `/me`, `/products`（プレースホルダ）
