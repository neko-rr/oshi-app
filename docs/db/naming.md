<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# DB 命名規則（oshi_app）

アプリの識別子・JSON・SQL に使う英語物理名の法則。  
**日本語はアプリでは使わない。** 人間向けの読み下しは生成物 `docs/db/generated/schema_guide.md`（`term_glossary` から自動）。

## 必須

1. すべて `snake_case`・小文字（[Supabase Tables](https://supabase.com/docs/guides/database/tables) に合わせる）
2. **テーブルは単数形**で統一（例: `photo`, `registered_product`）
3. **主キー**は `<意味>_id`（例: `photo_id`, `registered_product_id`）。汎用 `id` だけにしない
4. **テナント列**は必ず `members_id`（UUID = `auth.uid()`）
5. **外部キー列**は参照先 PK と同じ名前
6. 真偽は `*_flag`（新規は boolean 推奨。既存 int 0/1 は互換で可）
7. 瞬間の時刻は `*_at`（`timestamptz`）、日付のみは `*_date`
8. 並びは `display_order`、枠番号は `slot`
9. 禁止: 日本語識別子、camelCase、意味の違う英単語（旧 `receipt`＝領収 ≠ 収納）

## 改名するとき

1. `supabase/migrations/` に SQL を追加し、ライブ DB に適用
2. `apps/api` / `apps/web` / `packages/shared` のテーブル名・列名・JSON キーを同時更新
3. `docs/db/schema-catalog.md` を更新（日本語名は維持）
4. `docs/migration/v2/glossary.md` を更新
