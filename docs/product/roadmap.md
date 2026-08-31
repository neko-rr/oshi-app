<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# ロードマップ（製品）

ステータスの機械可読版は [meta/feature_status.json](meta/feature_status.json)。  
**いま何があるか**は [generated/](generated/) を正とする。

ステータス語彙: `shipped` / `partial` / `planned` / `deferred`（定義は [meta/status_vocabulary.md](meta/status_vocabulary.md)）

## Must（絶対必要に近い）

| ID | 内容 | 状態（目安） |
|----|------|--------------|
| `responsive_web` | スマホ画面で使える Web | partial |
| `theme_colors` | 推し色に合わせたテーマ変更 | partial |
| `barcode_capture` | バーコード読取・番号入力 | partial |
| `product_lookup` | グッズ情報との照合（楽天等） | partial |
| `photo_front` | 正面写真の撮影・アップロード | partial |
| `vision_assist` | 画像からの説明・照合アシスト | partial |
| `tag_assist` | 自動タグ提案 | partial |
| `register_flow` | 登録ウィザード（理想は [flows/register.md](flows/register.md)） | partial |
| `gallery` | 登録グッズ一覧 | shipped |
| `product_detail` | 詳細の閲覧・編集 | partial |
| `storage_locations` | 収納場所タグの編集・付与 | partial |
| `category_tags` | カテゴリタグ設定 | partial |
| `color_tags` | カラータグ設定 | partial |
| `search` | 検索 | planned |
| `privacy_policy` | プライバシーポリシー（学習させない告知含む） | planned |
| `auth_session` | ログイン・セッション（[acceptance/auth.md](acceptance/auth.md)） | shipped |

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
| `premium` | プレミアム移行 | deferred |

## サイトマップ（目標）

```text
/                 ホーム（導線）
/register         登録
/gallery          一覧
/gallery/[id]     詳細
/dashboard        ダッシュボード
/settings         設定（テーマ・タグ・収納・アカウント系）
/auth/*           ログイン・登録・パスワード
```

未実装の「推し部屋」等はルートを勝手に増やさない。`deferred` のまま要求待ち。
