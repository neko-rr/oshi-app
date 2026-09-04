<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# DoD: ギャラリー一覧

- [x] ログインユーザーの登録製品だけが一覧に出る
- [x] サムネイルがあれば表示される（signed URL 失敗時も画面が壊れない）
- [x] 行／カードから詳細へ遷移できる
- [x] 空のとき分かりやすい空状態がある
- [x] カテゴリ／収納のチップで絞り込める（複数可・同種 OR／異種 AND）
- [x] カラータグ（スロット）でも絞り込める
- [x] 一覧 URL にクエリ版 `v=1` が付く（パラメータがあるとき。欠落も v1 として読む）
- [x] いまの条件の件数要約と一発クリアがある（検索・カテゴリ・収納・色。並びは残す）
- [x] 名前付き保存ビューを最大20件まで保存・適用・削除できる（`gallery_view` / `GET|POST|PATCH|DELETE /gallery-views`）
- [x] 一覧上で並びを変えられる（URL `sort` ＋ `display_settings.list_sort` 同期）
- [x] 複数選択して収納を一括変更できる（`PATCH /products/bulk`）
- [x] 複数選択してカテゴリを一括変更できる（同エンドポイント・`category_tag_id` / `clear_category_tag`）
- [x] 選択モードで「このページ全選択」「条件結果を最大100件選択」「選択した N 件だけ表示」ができる
- [x] 「もっと見る」等で次ページを読める（`has_more`）
- [x] 検索 `q` がページを跨いで一致する（ページ内だけの絞り込みではない）
- [x] 詳細から戻ると一覧の検索・絞込・並び条件が維持される
- [x] 購入価格があればカードに金額表示（記録通貨優先、なければ表示設定。換算なし）
- [x] カードの名前／タグ／価格は設定で独立 ON/OFF（`gallery_show_*`、既定すべて ON）。名前 OFF 時もリンクの a11y 名は維持
- [x] ギャラリー内検索（`q`）が一覧の DoD として使える（`/search` 全面刷新は不要）

関連: `gallery` / `gallery_card_fields` / `gallery_filters_v2` / `gallery_sort_ui` / `gallery_bulk_storage` / `gallery_bulk_category` / `gallery_selection_scope` / `gallery_saved_views`
