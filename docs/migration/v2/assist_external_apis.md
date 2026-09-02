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

## 楽天（2026 新API・再登録済み）

- エンドポイント: `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701`
- 認証: `applicationId` + `accessKey` の両方必須（UUID / accessKey。Developer 再登録済み）
- スコープ: 楽天市場API（Ichiba）のみ
- アプリタイプ: Web アプリケーション＋許可Webサイト（Render URL 等）。`RAKUTEN_ORIGIN` を Origin/Referer に付与
- サーバー（FastAPI）経由のみ。モバイル端末から楽天へ直叩きしない
- 有効化: `RAKUTEN_LIVE_CALLS=1`（秘密は `apps/api/.env` / Render Dashboard のみ。Git 禁止）
- 公式索引: [docs/refs/official-links.md](../../refs/official-links.md)（Ichiba Item Search / Dashboard）
- 公式: https://webservice.rakuten.co.jp/documentation/ichiba-item-search

## エンドポイント（認証必須）

| Method | Path | サービス |
|--------|------|----------|
| POST | `/assist/vision/describe` | `io_intelligence_service.describe_image`（登録本線はこちら1回。`structured_data` に種類・色・見た目タグ） |
| POST | `/assist/tags/extract` | `tag_extraction_service.extract_tags`（登録ウィザード本線では未使用。将来・テキストのみ用） |
| POST | `/assist/barcode/lookup` | `barcode_lookup_service.lookup_by_barcode` |
| POST | `/assist/barcode/keyword` | `barcode_lookup_service.lookup_by_keyword` |

登録の本保存（`POST /products` / `POST /photos`）はこれらに依存しない。
