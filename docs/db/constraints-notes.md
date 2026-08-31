<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# 制約・スロット・よくあるルール（運用メモ）

自動生成の詳細: [generated/constraints.md](generated/constraints.md)

アプリ実装で特に重要なものだけ手で強調する。

## カラータグ

| 項目 | ルール |
|------|--------|
| `color_tag.slot` | **1..7**（CHECK） |
| 一意 | `(members_id, slot)` UNIQUE |
| 色 | `color_tag_color` は `#RRGGBB` |
| 製品への付与 | **接合表** `registered_product_color_tag` が正（単一 `color_tag_id` はレガシー） |
| 接合の slot | 1..7。FK `(members_id, slot)` → `color_tag` |

## カテゴリータグ / 収納場所

| 項目 | ルール |
|------|--------|
| プリセット `slot` | **1..6** または追加行は `NULL` |
| 部分 UNIQUE | `(members_id, slot) WHERE slot IS NOT NULL` |
| `display_order` | 一覧の並び |
| 削除済みプリセット | `*_preset_slot_dismissed`（未連携時は GRANT なし） |

## テナンシー

- ユーザー所有表はすべて `members_id` → `auth.users(id)`
- RLS: `auth.uid() = members_id`

## 写真 path

- DB には Storage **object path**（`{members_id}/....jpg`）
- 詳細: [storage.md](storage.md)

生成物の更新後にこのファイルの「手強調」が古い場合は直す（スクリプトはここを上書きしない）。
