# 初回発火しやすい Dash コールバック一覧（棚卸し）

`prevent_initial_call` 未指定は `False` とみなす。`Output` が現在レイアウトに無いコールバックは実行されない（`suppress_callback_exceptions=True`）。

凡例: **初回**= 初回描画後にサーバー POST が走り得るか。**重さ**= 軽 / 中 / 重。**統合**= 他コールバックとのマージ可否（計画メモ）。

## グローバル（`app.py`）

| コールバック | ファイル | 初回 | prevent_initial | 重さ | 統合・備考 |
|--------------|----------|------|-------------------|------|------------|
| `/register` → `/register/select` | `app.py` clientside | ブラウザのみ | — | 軽 | 固定パス（サーバー `_redirect_register` は廃止） |
| `_sync_nav_store_and_theme` | `app.py` | はい | False | 中 | 旧 `_reset_store` + `sync_theme_on_navigation` を統合 |

## テーマ（`components/theme_utils.py`）

| コールバック | 初回 | prevent_initial | 重さ | 統合・備考 |
|--------------|------|-------------------|------|------------|
| `save_theme_callback` | initial_duplicate | 重複許容 | 軽 | クリック時 |
| `update_preview_from_card` | いいえ | True | 軽 | |
| `mark_active_card` | 設定ページのみ | 未指定 | 軽 | |
| clientside `applyBootswatchFromStores` | はい（クライアント） | True | 軽 | `theme-store` / `theme-preview-store` / pathname、`themeScroll.js` で許可リスト検証 |

## ギャラリー（`pages/gallery/index.py`）

| コールバック | 初回 | prevent_initial | 重さ | 統合・備考 |
|--------------|------|-------------------|------|------------|
| `_update_swatch_styles` | はい | False | 軽 | |
| `_toggle_color_filter` | いいえ | True | 軽 | |
| `_gallery_on_pathname` | initial_duplicate | | 重 | |
| `_gallery_on_pager` | initial_duplicate | | 重 | |
| `_gallery_products_to_ui`（load-more disabled + content） | はい | False | 中〜重 | 2 Output 統合済み |
| `_navigate_to_detail` | initial_duplicate | | 軽 | |

## ギャラリー詳細（`pages/gallery/detail.py`）

| コールバック | 初回 | prevent_initial | 重さ | 統合・備考 |
|--------------|------|-------------------|------|------------|
| `_on_query_change` | クエリ無しは PreventUpdate | 未指定 | 重（DB） | 空クエリは POST 抑止 |

## ダッシュボード（`pages/dashboard.py`）

| コールバック | 初回 | prevent_initial | 重さ | 統合・備考 |
|--------------|------|-------------------|------|------------|
| `_dashboard_chart_slot` | いいえ（True） | True | クリック後のみ重 | 初回 POST 削減 |

## レビュー（`features/review/controller.py`）

| コールバック | 初回 | 重さ | 統合・備考 |
|--------------|------|------|------------|
| `_review_store_lightweight_ui`（color-tag value + interval disabled + save disabled） | はい | 軽 | 1 本に統合済み |
| `_update_color_tags` | いいえ | 軽 | |
| `render_tag_feedback` | はい | 軽 | |
| `render_review_summary` | はい | 軽 | |
| `update_photo_thumbnail` | はい | **重** | 遅延・別トリガー検討 |
| `process_tags` | initial_duplicate | **重** | |
| `update_tags_on_registration_change` | はい | 軽 | |
| `display_api_results` | pathname により | 軽 | |
| 保存・auto-fill 等 | initial_duplicate / 条件付き | 中 | |

## 登録選択・バーコード・写真（参照）

| ファイル | 備考 |
|----------|------|
| `pages/register/select.py` | `prevent_initial_call=True` |
| `features/barcode/controller.py` | 主要は `initial_duplicate` |
| `features/photo/controller.py` | 主要は `initial_duplicate` |
| `features/color_tag/controller.py` | `prevent_initial_call=True` |
