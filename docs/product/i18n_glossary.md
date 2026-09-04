<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# Web 翻訳用語集（推し活・製品語）

エージェント／人が `messages/en.json` を書くときの一貫性用。  
**runtime の next-intl 辞書ではない。** DB `term_glossary` やコード識別子 glossary とも別。

正本の画面文言は常に [`apps/web/messages/ja.json`](../../apps/web/messages/ja.json)。  
同期手順: skill **`i18n-web-sync`** / キー検査: `python scripts/check_i18n_message_keys.py`

## 推奨訳

| JA | EN（推奨） | メモ |
|----|------------|------|
| 推し | oshi | 借用語として残す（your oshi） |
| 推し活 | oshi activity / fan activity | UI では短く。長い説明文のみ oshi-katsu 可 |
| グッズ | merch | goods より merch |
| 推しグッズ | merch / oshi merch | 文脈で |
| ギャラリー | Gallery | 画面名・ナビ |
| 収納 | storage | |
| 収納場所 | storage location | 設定画面タイトル |
| カラータグ | color tag | **テーマ色と混同しない**（design: oshi-accents） |
| カテゴリタグ | category tag | |
| テーマ色 | theme | 見た目パック |
| 推し色 | oshi color | スウォッチ等。テーマパックとは別概念もあり |
| 登録 | register | 製品登録フロー |
| 新規登録 | sign up | **Auth のみ** |
| 製品 | product | 登録したグッズ1点（業務語） |
| ダッシュボード | Dashboard | |
| 見た目 | Appearance | `/settings/theme` |
| 非表示 | Hide / Hidden | プリセット dismiss |
| 再表示 | Show again | |
| バーコード | barcode | |
| メモ | notes / memo | 既存 en に合わせて notes でも可 |

## 使わない／避ける

| 避けたい EN | 理由 |
|-------------|------|
| goods（グッズの定訳として） | merch に寄せる |
| idol（推しの定訳） | 範囲が狭い。oshi を優先 |
| warehouse（収納） | storage の方が日常的 |
| color theme（カラータグ） | テーマ色と混同する |

## 更新方針

- 新用語が出たらこの表に追記してから en 下書きする
- 既存 `en.json` と食い違う場合は、**用語集を直すか en を揃えるか**を人が決める（skill は勝手に一括置換しない）
