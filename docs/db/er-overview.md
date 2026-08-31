<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# ER 概要（読み方・手書き補足）

自動生成の図: [generated/er-diagram.md](generated/er-diagram.md)

## 中心の考え方

推し活グッズ管理では、ユーザーが登録した **1 点のグッズ** が `registered_product` です。

```text
会員 (auth.users / members_id)
  ├─ photo（写真ファイルのメタ + Storage path）
  ├─ color_tag / category_tag / storage_location（自分用タグ）
  └─ registered_product（登録製品）── photo, tags, storage
         └─ registered_product_color_tag（製品×カラースロット 最大7）
```

マスタ（作品・キャラ・版権など）は `schema_ready` で、**連携するまで Data API 不可**。

## よく触る関係

| 親子 | 関係 |
|------|------|
| `registered_product` → `photo` | 任意。サムネ path は photo 側 |
| `registered_product` → `category_tag` / `storage_location` | 任意 FK |
| `registered_product_color_tag` | 製品と color_tag の slot 接合（正） |
| `color_tag` / `category_tag` / `storage_location` | すべて `members_id` 所有 |

再生成: `python scripts/generate_db_docs.py ...`
