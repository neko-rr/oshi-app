<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# ロードマップ（製品）

ステータスの機械可読版は [meta/feature_status.json](meta/feature_status.json)。  
**いま何があるか**は [generated/](generated/) を正とする。  
**v2 移行の要約:** [v2_status.md](v2_status.md)

ステータス語彙: `shipped` / `partial` / `planned` / `deferred`（定義は [meta/status_vocabulary.md](meta/status_vocabulary.md)）

## Must（絶対必要に近い）— ほぼ移行完了

| ID | 内容 | 状態（目安） |
|----|------|--------------|
| `auth_session` | ログイン・セッション | shipped |
| `register_flow` | 登録ウィザード | shipped |
| `barcode_capture` | バーコード読取・番号入力 | shipped |
| `product_lookup` | グッズ情報照合（楽天） | shipped |
| `photo_front` | 正面写真の撮影・アップロード | shipped |
| `vision_assist` | 画像 Vision アシスト | shipped |
| `tag_assist` | 見た目タグ・種類提案（Vision 1回） | shipped |
| `gallery` | 登録グッズ一覧 | shipped |
| `gallery_card_fields` | カードの名前／タグ／価格表示 ON/OFF | shipped |
| `gallery_filters_v2` | 複数チップ＋色絞り込み | shipped |
| `gallery_sort_ui` | 一覧上の並び（URL＋設定同期） | shipped |
| `gallery_bulk_storage` | 複数選択で収納一括変更 | shipped |
| `gallery_bulk_category` | 複数選択でカテゴリ一括変更（同 bulk API） | shipped |
| `gallery_selection_scope` | 選択範囲操作（ページ全選択／条件最大100／選択のみ表示） | shipped |
| `gallery_saved_views` | 名前付きフィルタ＋並びの保存（無料・上限20） | shipped |
| `product_detail` | 詳細の閲覧・編集 | shipped |
| `storage_locations` | 収納場所タグ | shipped |
| `category_tags` | カテゴリタグ設定 | shipped |
| `color_tags` | カラータグ設定 | shipped |
| `search` | 検索 | shipped |
| `privacy_policy` | プライバシーポリシー | shipped |
| `licenses_notices` | ライセンス・表記 | shipped |
| `data_export` | 設定からのデータ書き出し（テキスト／写真付き ZIP。再取り込みなし） | shipped |
| `theme_colors` | テーマパック（トークン一式切替） | shipped |
| `oshi_accent` | 推し色2色オーバーレイ（適用はプレミアム想定・無料はプレビュー） | shipped |
| `display_settings` | 文字サイズ・UI密度（7段階・見た目画面） | shipped |
| `product_currency_fiat` | 製品ごとの法定通貨記録（表示設定とは分離。換算なし） | shipped |
| `i18n_web` | 多言語（ja/en・URL `/en`・辞書段階移行） | partial |
| `responsive_web` | スマホ画面で使える Web | partial |

## Phase 2

| ID | 内容 | 状態 |
|----|------|------|
| `dashboard` | ダッシュボード | partial |
| `spending` | 推しへの支出の家計簿的集計 | planned |
| `tag_analytics` | 推し色割合などタグ分析 | planned |
| `oshi_days` | 推し初めて何日 | planned |
| `duplicate_exchange` | ダブり・交換 OK 数 | planned |
| `storage_capacity` | 規定サイズタグでの収納枚数計算 | planned |

## Phase 3 / Later

| ID | 内容 | 状態 |
|----|------|------|
| `oshi_room` | 背景にグッズ写真を貼る推し空間 | deferred |
| `sns_share` | GET 投稿・求譲など SNS 連携 | deferred |
| `legal_terms` | 利用規約・お問い合わせ・バージョン | deferred |
| `account_delete` | 全データ削除・退会 | deferred |
| `premium` | プレミアム移行（推し色の全体適用・保存を含む候補） | deferred |
| `crypto_nft_assets` | 暗号資産・NFT（法定通貨と別モデル） | deferred |

### 通貨まわりの決定メモ（2026-09-04）

- アカウントの表示通貨は **記号・桁区切りのみ**（既に `display_settings`）
- Must の次は **製品ごとの法定通貨記録**（デジタル購入のドル／円混在に対応）
- NFT／暗号は Must に入れない。要求されるまで `crypto_nft_assets` のまま

## サイトマップ（目標）

```text
/                 ホーム（導線）
/register         登録
/gallery          一覧
/gallery/[id]     詳細
/search           検索
/dashboard        ダッシュボード
/settings         設定（見た目・タグ・収納・データ書き出し・アカウント系）
/settings/export  データ書き出し（一覧テキスト／写真付き ZIP）
/privacy          プライバシーポリシー
/licenses         ライセンス・表記
/auth/*           ログイン・登録・パスワード
```

未実装の「推し部屋」等はルートを勝手に増やさない。`deferred` のまま要求待ち。
