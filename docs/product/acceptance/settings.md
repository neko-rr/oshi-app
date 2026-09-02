<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# DoD: 設定（タグ・収納・テーマ・アカウント導線）

- [x] `/settings` から各設定画面へ行ける（見た目／タグ・収納／アカウント／法務）
- [x] カラータグを一覧・保存できる
- [x] カテゴリタグを追加・編集・削除できる（Lucide アイコンピッカー・slug 保存）
- [x] 収納場所を追加・編集・削除できる（Lucide アイコンピッカー）
- [x] テーマを `/settings/theme` で選び、`GET/PUT /theme-settings` に保存できる（既定は緑系 `default`。todo-app 方式でトークン一式切替。UI は Lab B。枠黒＝ライト／枠白＝ダーク）
- [x] アカウント情報（`/me`）・パスワード変更（`/auth/update-password`）へ行ける
- [x] データはログインユーザーに閉じる（JWT + RLS）
- [ ] 退会・全削除（`account_delete` は deferred）
- [ ] 推し色スウォッチ UI（Design Lab 後続 — テーマパックとは別）
- [x] タグ・収納アイコンは Lucide slug + ピッカー（`lucide_icon_picker.json`）
- [x] カテゴリ／収納は ↑↓ で並び替え（`display_order` → 登録・詳細の選択肢順）
- [x] 初期プリセット（slot 1–6）は「非表示」で dismiss し、再表示できる
- [x] ギャラリー一覧・詳細でカテゴリ／収納アイコンをチップ表示

関連: `color_tags` / `category_tags` / `storage_locations` / `theme_colors`
