<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# DoD: 検索（ギャラリー内）

独立ルート `/search` は置かない。キーワード検索はギャラリー一覧の一部。

- [x] ギャラリーで `q` によりログインユーザーの製品を名前等で絞り込める
- [x] `GET /products?q=` が API で使える（未ログインは 401）
- [x] 結果は自分のテナントのみ（JWT + RLS）
- [x] 最近使った検索・条件をチップから再適用できる（端末ローカル）
- [x] ゲストは API エラーではなく本登録 CTA を見る（検索フォームは非表示）

後続（Must 外の強化）: ファセット・サーバー側全文検索の高度化。

関連: `search` / `gallery` / `gallery_recent_filters` / `guest_onboarding` / `docs/product/flows/gallery.md` / `docs/product/flows/guest.md`
