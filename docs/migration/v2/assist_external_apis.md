<!-- 更新: ARCHIVE寄り — 移行メモ。現行正本はルート AGENTS.md と .cursor/rules/*.mdc。凡例: docs/README.md -->
# 外部アシスト（IO / 楽天）呼び出し設計

v2 FastAPI（`apps/api`）の `/assist/*` 設計。  
（由来: Dash 期の `io_intelligence` / `tag_extraction` / `barcode_lookup` を入口だけ移した。）

## 方針

| 状態 | `status` | 挙動 |
|------|----------|------|
| キー未設定 | `missing_credentials` | HTTP しない |
| キーあり・LIVE オフ（既定） | `live_disabled` | HTTP しない |
| LIVE オン | `success` / `error` 等 | 実 HTTP（下記モデル順） |

- 有効化フラグ: `IO_LIVE_CALLS=1` / `RAKUTEN_LIVE_CALLS=1`
- IO モデル順: 主（Vision=`IO_INTELLIGENCE_MODEL` / タグ=`IO_TAG_MODEL`）→ 失敗時のみ `IO_INTELLIGENCE_FALLBACK_MODEL`
- ユニットテストは httpx モック（実キー不要）。実接続確認は手動

## エンドポイント（認証必須）

| Method | Path | サービス |
|--------|------|----------|
| POST | `/assist/vision/describe` | `io_intelligence_service.describe_image` |
| POST | `/assist/tags/extract` | `tag_extraction_service.extract_tags` |
| POST | `/assist/barcode/lookup` | `barcode_lookup_service.lookup_by_barcode` |
| POST | `/assist/barcode/keyword` | `barcode_lookup_service.lookup_by_keyword` |

登録の本保存（`POST /products` / `POST /photos`）はこれらに依存しない。
