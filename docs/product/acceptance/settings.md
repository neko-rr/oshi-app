<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# DoD: 設定（タグ・収納・テーマ・アカウント導線）

- [x] `/settings` から各設定画面へ行ける（見た目／タグ・収納／アカウント／法務）
- [x] カラータグを一覧・保存できる
- [x] カテゴリタグを追加・編集・削除できる（Lucide アイコンピッカー・slug 保存）
- [x] 収納場所を追加・編集・削除できる（Lucide アイコンピッカー）
- [x] テーマを `/settings/theme` で選び、`GET/PUT /theme-settings` に保存できる（既定は緑系 `default`。todo-app 方式でトークン一式切替。UI は Lab B。枠黒＝ライト／枠白＝ダーク）
- [x] `/settings/theme`（見た目）で文字の大きさ（7段階）と UI 密度（7段階）を定点スナップバーで変え、ドラッグ中に即反映できる
- [x] 文字・密度は `GET/PUT /display-settings`（`text_scale` / `ui_density`、1〜7）に保存できる（未ログイン時は localStorage）
- [x] 同じ見た目画面で一覧の並び既定（`list_sort`: newest / name / created_at）、ギャラリー表示（`gallery_layout`: grid / large / list）、ログイン後の着地（`landing_page`: home / gallery / register）を選べる
- [x] 同じ見た目画面でカードに載せる情報（名前／タグ／価格）を独立スイッチで切替できる（`gallery_show_name` / `gallery_show_tags` / `gallery_show_price`、既定 ON）
- [x] ギャラリー・検索は並び既定と表示モードとカード表示項目を反映する。ログイン成功後は着地へ遷移する
- [x] `/settings/theme` で表示言語（ja / en）を切り替えられる（URL: 日本語は無印、英語は `/en`。next-intl）
- [x] `/settings/theme` で居住地（大陸別・検索付き）と日時・金額の個別上書き（IANA TZ・日付形式・表示通貨・金額書き方）を設定でき、登録日・購入価格などが居住地ローカルで表示される（金額は換算なし）
- [x] 設定・タグ・収納・見た目・アカウント／法務の表示文言は `messages/ja.json`（正本）と `en.json` 経由（`useTranslations` / `getTranslations`）
- [x] アカウント情報（`/me`）・パスワード変更（`/auth/update-password`）へ行ける
- [x] データはログインユーザーに閉じる（JWT + RLS）
- [ ] 退会・全削除（`account_delete` は deferred）
- [x] `/settings/export` から一覧テキスト（JSON＋CSV）と写真付き ZIP を書き出せる（`data_export`。再取り込みなし。署名 URL は含めない）
- [x] 推し色スウォッチ UI（テーマパックとは別。メイン＋サブの2色。文字色は自動で AA 確保。無料はプレビューのみ・適用／保存はプレミアム想定の entitlement）
- [x] タグ・収納アイコンは Lucide slug + ピッカー（`lucide_icon_picker.json`）
- [x] カテゴリ／収納は ↑↓ で並び替え（`display_order` → 登録・詳細の選択肢順）
- [x] 初期プリセット（slot 1–6）は「非表示」で dismiss し、再表示できる
- [x] ギャラリー一覧・詳細でカテゴリ／収納アイコンをチップ表示
- [x] `/settings/register` で登録の始め方と「いつも選ぶ収納」を設定でき、登録ウィザードに反映される（`register_start_step` / `default_storage_location_id`）

関連: `color_tags` / `category_tags` / `storage_locations` / `theme_colors` / `oshi_accent` / `display_settings` / `register_wizard_defaults` / `gallery_card_fields`
