# このファイルは Cursor への指示用です。【このファイルの内容を修正禁止】

# 推し活グッズ管理アプリ

主に BOX やガチャを管理する推し活支援アプリ。
バーコードの読み取りや製品写真を撮る事で、照合して可能な限り自動で製品を判別してタグ付けしてくれる。
使用者が収納場所をタグ付けする事で、リアルとデータをつないで、一覧で管理が加速する。

# 最低限のファイル構成

- app.py # Dash アプリのメインファイル
- components/ # UI 部分（レイアウト・カード・ボタンなど）
  - layout.py # 全体レイアウト構成
  - upload_section.py # 画像・バーコードアップロード UI
- services/ # ロジック(API 呼び出し・照合処理など）
  - barcode_service.py # バーコード解析
  - photo_service.py # 画像ストレージ・DB への CRUD
  - barcode_lookup.py # 楽天 API などでバーコード照合
  - image_description.py # IO Intelligence API で画像説明生成
  - tag_extraction.py # タグ抽出処理
  - db_handler.py # DB 登録・取得処理
- assets/ # CSS や画像などの静的ファイル
  - styles.css # デザイン調整用 CSS
- data/ # 一時保存用のデータ(JSON や SQLite)
  - registration_product_information.json # 登録されたグッズ情報
- apt.txt # 使用ライブラリ一覧（OS レベル）
- requirements.txt # 使用ライブラリ一覧（Python レベル）
- .env # API キーなどの環境変数テンプレート
- README.md # プロジェクト説明・使い方・構成
- Cursor.md # Cursor が修正した内容説明
- spec.md # Cursor に伝えるようの仕様書
- .gitignore
- Procfile # Render に起動方法を伝える
- Dockerfile # Render の起動に必要。Python だけでは、写真が無理だった。
- supabase #使用する可能性があるので、残す。簡易 DB
  他に必要なファイルがあれば、残してください

# 使用技術

- Python の Dash
- 将来的にフレームワークを変更する事も視野に入れて、ロジックを関数化する
- 公開は、GitHub にあげて、Render
- データベースは、SUPABASE
- アイコンは、Bootstrap Icons
  - [https://icons.getbootstrap.com/#accessibility](https://icons.getbootstrap.com/#accessibility)

# 機能要件

- 【絶対必要】
  - スマホ画面対応
  - 推し色に合わせたカラー対応（背景とかアイコンとか）
    - Dash のテーマを使用して、設定画面から変更可能
  - グッズ情報との照合
  - バーコード読み取り
  - 画像マッチ
  - プライバシーポリシー
    - 機械学習でタグ付けするがアップロードされた写真は学習させません告知
  - 検索
  - SNS シェア
    - グッズ GET 投稿
    - 求＆譲の交換希望投稿
- 【第 2 フェーズ】
  - ダッシュボード
  - 家計簿的に推しに使用した金額
  - 推し色割合等のタグ分析
  - 推し初めて何日
  - ダブり&交換 OK 数管理
  - 収納場所管理
    - 番号割当で収納場所自由入力
    - 規定サイズタグを使用して、収納枚数計算（例：缶バッチ 24x24 が収納するのに仕分けクリアファイルが何枚必要か？全数は？）
- 【第 3 フェーズ】
  - 背景画像に合わせて、管理用に撮影したグッズ画像を貼り付けて、推し空間作成

# サイトマップ

- HOME
  - 写真を登録
  - 一覧
  - ダッシュボード
  - 推し部屋
  - 設定
    - アカウント情報
    - 収納場所タグ編集
    - 優先・任意タグ設定
    - テーマーカラー変更
    - プレミアムへ移行
    - お問い合わせ
    - バージョン情報
    - プライバシーポリシー
    - 利用規約
    - データを全て削除
    - 退会

# 開発予定の内容

## 製品登録のフロー（利用者画面では 1⇒2⇒6(タグ付けローディング中表示含む) の画面で進んでいきます）

製品は、グッズから漫画、書籍まで、何が登録されるか分かりません。 1.バーコードの読み取り or アップロード or バーコード番号の入力

- 手順 1
  - barcode_service.py と photo_service.py に該当
  - 1 ページ内の表示の順番は上から、読み取り ⇒ アップロード ⇒ バーコード番号の入力の順
  - 写真の読み取り時は、撮影中のライブビューイングがあるようにしてください
  - スキップする選択肢もボタンで用意する事
  - 読み取り or アップロード or バーコード番号の入力後、手順 2 に移行できるように自動遷移や入力確定ボタンを用意してください。
  - 情報を全て手動入力する選択肢ボタンも作成してください。
  - Output：バーコード情報を楽天 API に渡す（撮影した写真は、登録しない）
  - IF(失敗)：バーコード読み取りに失敗した場合は、「もう一度挑戦する」or「スキップ」の 2 択を選べるようにしてください。
  - IF（成功)：手順 2 に自動で移行してください。
- 手順 2.正面写真の登録（アップロード or 撮影）
  - ファイルは、関数化してください（写真の登録は、一覧に追加してからも関連写真として、追加できるようにするため、何度も使用機会があります）
  - スキップする選択肢もボタンで用意する事
  - 写真の読み取り時は、撮影中のライブビューイングがあるようにしてください。
  - この写真は、保存して、後で登録グッズの一覧画像で使用します。また、後でその写真を飾り付けたりにも使用します。
  - 最初のこの製品登録の際は、「正面写真」のみに限定します。可能な限り、アップで正面写真を撮ってもらうようにしてください。
  - 読み取り or アップロード後、手順 6 の画面に移行できるように、入力確定ボタンを用意してください。
  - 「もう一度挑戦する」or「スキップ」のボタンも選べるようにしてください。
- 手順 3.上記 1 のバーコード情報を楽天 API で照合して、製品情報を抽出
  - barcode_lookup.py に該当
  - Input：上記 1 のバーコード情報
  - Output：製品情報（登録情報・タグ付けに使用）
  - IF(失敗)：失敗した場合は、利用者に知らせる通知は不要。そのまま 4 の手順に進むだけ。
  - IF（成功）:成功しても 4 の手順に進みます。
- 手順 4.上記の 2 の写真を IO Intelligence API で画像内容を説明 ⇒IF.上記 3 が失敗した場合、テキストベースで楽天 API で照合
  - image_description.py に該当
  - IO Intelligence API(Vision モデル：例 LLaVA 系)は、絶対に使用してください。
  - 参考（精度が上がるならば検討してください）：CLIP（画像 ⇒ テキスト特徴抽出：ベクトル化）、FAISS(類似検索)
  - Input：上記 2 の写真
  - Output：製品情報（登録情報・タグ付けに使用）
  - IF(失敗)：上記 3 失敗時の照合は、写真からテキスト化した情報を楽天 API 検索等からお願いします。
  - IF(成功)：上記 3 が成功していた場合は、写真のテキスト化のみです。
  - 精度向上の参考：解像度の統一・トリミング（主題を中央に配置）・ノイズ除去＆露出補正
  - Output：製品情報（登録情報・タグ付けに使用）
- 手順 5.上記 3 の製品情報と上記 4 の製品テキスト情報からタグ抽出
  - tag_extraction.py に該当
  - 参考：IO Intelligence API(LLM)、spaCy や KeyBERT(タグ抽出)
  - 上記 3 と 4 の製品情報から、登録するためのタグを抽出
  - 上記 1 と 2 の両方をスキップした場合は、製品情報が無いため、手順 6 の画面に移動して、全てを利用者が入力できるようにしてください。
- 手順 6.ユーザーによる微調整

  - 上記手順 3 ～ 5 の間、Output の製品情報抽出が終わるまで、ローディング画面を表示してください。
  - 上記手順 5 が修了していなくても、利用者が登録ボタンを押せば登録できるようにしてください。
  - 照合した結果を表示して、利用者が微調整できるようにしてください。
  - 登録ボタンを表示して、登録を実行してください。
  - 登録完了後は、利用者に登録完了を通知する画面表示の後、最初の手順 1 の画面に戻ってください。

    ※注意事項：楽天 API で参照できる製品情報が理解できていないため、探索用の EDA.py を作成して、照合結果を全部表示してください。
    結果次第で、データベースの内容や登録する情報も変わります。

※参考 IO Intelligence API の使用方法
【モデル取得】

```
curl https://api.intelligence.io.solutions/api/v1/models
```

【API 実行】

```
curl https://api.intelligence.io.solutions/api/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $IO_INTELLIGENCE_API_KEY" \
  -d '{
    "model": "meta-llama/Llama-3.2-90B-Vision-Instruct",
    "messages": [{"role":"user","content":"Say this is a test"}],
    "temperature": 0.7
  }'
```

# データベース

| 役割           | 名称日本語      | メソッド名        | データ型 | キー設定    |
| -------------- | --------------- | ----------------- | -------- | ----------- |
| エンティティ名 | 作品シリーズ    | works_series      | 文字列   |             |
| 属性           | 作品シリーズ ID | works_series_id   | 整数     | Primary Key |
| 属性           | 作品シリーズ名  | works_series_name | 文字列   |             |

| 役割           | 名称日本語      | メソッド名        | データ型 | キー設定    |
| -------------- | --------------- | ----------------- | -------- | ----------- |
| エンティティ名 | 作品情報        | works_information | 文字列   |             |
| 属性           | 作品 ID         | works_id          | 整数     | Primary Key |
| 属性           | 作品名          | title             | 文字列   |             |
| 属性           | 作品シリーズ ID | works_series_id   | 整数     | Foreign Key |

| 役割           | 名称日本語  | メソッド名             | データ型 | キー設定    |
| -------------- | ----------- | ---------------------- | -------- | ----------- |
| エンティティ名 | 版権元      | copyright_source       | 文字列   |             |
| 属性           | 版権会社 ID | copyright_company_id   | 整数     | Primary Key |
| 属性           | 版権会社名  | copyright_company_name | 文字列   |             |

| 役割 | 名称日本語      | メソッド名      | データ型 | キー設定    |
| ---- | --------------- | --------------- | -------- | ----------- |
| 属性 | キャラクター ID | character_id    | 整数     | Primary Key |
| 属性 | 作品 ID         | works_id        | 整数     | Foreign Key |
| 属性 | 作品シリーズ ID | works_series_id | 整数     | Foreign Key |
| 属性 | テーマ色        | theme_color     | 整数     | Foreign Key |
| 属性 | 髪色            | hair_color      | 整数     | Foreign Key |
| 属性 | 目の色          | eye_color       | 整数     | Foreign Key |
| 属性 | キャラクター名  | character_name  |          |             |
| 属性 | 愛称            | nickname        |          |             |
| 属性 | 性別            | sex             |          |             |
| 属性 | 人フラグ        | person_flag     |          |             |
| 属性 | 動物フラグ      | animal_flag     |          |             |
| 属性 | 実在フラグ      | existing_flag   |          |             |
| 属性 | 足数            | foot_number     |          |             |
| 属性 | 身長            | height          |          |             |
| 属性 | 体重            | weight          |          |             |
| 属性 | 誕生日          | birthday        |          |             |
| 属性 | デビュー日      | debut_date      |          |             |
| 属性 | 年齢            | age             |          |             |
| 属性 | 学生フラグ      | student_flag    |          |             |

| 役割           | 名称日本語    | メソッド名       | データ型 | キー設定    |
| -------------- | ------------- | ---------------- | -------- | ----------- |
| エンティティ名 | 色            | color            | 文字列   |             |
| 属性           | 色グループ ID | color_group_id   | 整数     | Primary Key |
| 属性           | 色グループ名  | color_group_name | 文字列   |             |
| 属性           | 色設定        | color_preference | RGB      |             |

| 役割           | 名称日本語      | メソッド名         | データ型 | キー設定    |
| -------------- | --------------- | ------------------ | -------- | ----------- |
| エンティティ名 | 製品種別        | product_type       | 文字列   |             |
| 属性           | 製品グループ ID | product_group_id   | 整数     | Primary Key |
| 属性           | 製品グループ名  | product_group_name | 文字列   |             |

| 役割           | 名称日本語      | メソッド名               | データ型 | キー設定    |
| -------------- | --------------- | ------------------------ | -------- | ----------- |
| エンティティ名 | 製品規格サイズ  | product_regulations_size | 文字列   |             |
| 属性           | 製品サイズ ID   | product_size_id          | 整数     | Primary Key |
| 属性           | 製品グループ ID | product_group_id         | 整数     | Foreign Key |
| 属性           | 製品の形        | product_type             | 文字列   |             |
| 属性           | 製品サイズ横    | product_size_horizontal  | 整数     |             |
| 属性           | 製品サイズ奥行  | product_size_depth       | 整数     |             |
| 属性           | 製品サイズ縦    | product_size_vertical    | 整数     |             |

| 役割           | 名称日本語                 | メソッド名                       | データ型 | キー設定    |
| -------------- | -------------------------- | -------------------------------- | -------- | ----------- |
| エンティティ名 | 収納場所                   | receipt_location                 | 文字列   |             |
| 属性           | 収納場所 ID                | receipt_location_id              | 整数     | Primary Key |
| 属性           | 収納場所名                 | receipt_location_name            | 文字列   |             |
| 属性           | 収納場所サイズ横           | receipt_location_size_horizontal | 整数     |             |
| 属性           | 収納場所サイズ奥行         | receipt_location_size_depth      | 整数     |             |
| 属性           | 収納場所サイズ縦           | receipt_location_size_vertical   | 整数     |             |
| 属性           | 1 個あたりの収納数         | receipt_count_per_1              | 整数     |             |
| 属性           | 1 個あたりの収納サイズ横   | receipt_size_horizontal_per_1    | 整数     |             |
| 属性           | 1 個あたりの収納サイズ奥行 | receipt_size_depth_per_1         | 整数     |             |
| 属性           | 1 個あたりの収納サイズ縦   | receipt_size_vertical_per_1      | 整数     |             |
| 属性           | 収納場所アイコン           | receipt_location_icon            | 文字列   |             |
| 属性           | 収納場所使用フラグ         | receipt_location_use_flag        | 整数     |             |

| 役割           | 名称日本語               | メソッド名                | データ型 | キー設定    |
| -------------- | ------------------------ | ------------------------- | -------- | ----------- |
| エンティティ名 | アイコンタグ             | icon_tag                  | 文字列   |             |
| 属性           | アイコン                 | icon                      | 文字列   | Primary Key |
| 属性           | アイコン名               | icon_name                 | 文字列   |             |
| 属性           | カテゴリータグ使用フラグ | category_tag_use_flag     | 整数     |             |
| 属性           | 収納場所使用フラグ       | receipt_location_use_flag | 整数     |             |

| 役割           | 名称日本語        | メソッド名         | データ型       | キー設定    |
| -------------- | ----------------- | ------------------ | -------------- | ----------- |
| エンティティ名 | 会員情報          | member_information | 文字列         |             |
| 属性           | 会員 ID           | members_id         | 整数           | Primary Key |
| 属性           | 会員種別名        | members_type_name  | 文字列         | Foreign Key |
| 属性           | ユーザ名          | user_name          | 文字列         |             |
| 属性           | メールアドレス    | email_address      | メールアドレス |             |
| 属性           | X_ID              | x_id               | 文字列         |             |
| 属性           | インスタグラム ID | instagram_id       | 文字列         |             |
| 属性           | LINE_ID           | line_id            | 文字列         |             |

| 役割           | 名称日本語           | メソッド名                          | データ型 | キー設定    |
| -------------- | -------------------- | ----------------------------------- | -------- | ----------- |
| エンティティ名 | 会員種別             | member_type                         | 文字列   |             |
| 属性           | 会員種別名           | members_type_name                   | 文字列   | Primary Key |
| 属性           | サムネイル画質       | thumbnail_image_quality             | 整数     |             |
| 属性           | 登録可能枚数         | registerable_number                 | 整数     |             |
| 属性           | 高解像度登録可能枚数 | number_registerable_high_resolution | 整数     |             |

| 役割           | 名称日本語         | メソッド名                    | データ型 | キー設定    |
| -------------- | ------------------ | ----------------------------- | -------- | ----------- |
| エンティティ名 | 写真               | photo                         | 文字列   |             |
| 属性           | 写真 ID            | photo_id                      | 整数     | Primary Key |
| 属性           | 写真のテーマ色     | photo_theme_color             | 整数     | Foreign Key |
| 属性           | 正面フラグ         | front_flag                    | 整数     |             |
| 属性           | 写真サムネイル     | photo_thumbnail               | 画像     |             |
| 属性           | 写真サムネイル画質 | photo_thumbnail_image_quality | 整数     |             |
| 属性           | 写真高解像度フラグ | photo_high_resolution_flag    | 整数     |             |
| 属性           | 写真編集済フラグ   | photo_edited_flag             | 整数     |             |
| 属性           | 写真登録日         | photo_registration_date       | 日付     |             |
| 属性           | 写真編集日         | photo_edit_date               | 日付     |             |
| 属性           | 写真サムネイル URL | photo_thumbnail_url           | URL      |             |
| 属性           | 写真高解像度 URL   | photo_high_resolution_url     | URL      |             |

| 役割           | 名称日本語    | メソッド名      | データ型 | キー設定    |
| -------------- | ------------- | --------------- | -------- | ----------- |
| エンティティ名 | カラータグ    | color_tag       | 文字列   |             |
| 属性           | カラータグ ID | color_tag_id    | 整数     | Primary Key |
| 属性           | 会員 ID       | members_id      | 整数     | Foreign Key |
| 属性           | カラータグ色  | color_tag_color | RGB      |             |
| 属性           | カラータグ名  | color_tag_name  | 文字列   |             |

| 役割           | 名称日本語               | メソッド名            | データ型 | キー設定    |
| -------------- | ------------------------ | --------------------- | -------- | ----------- |
| エンティティ名 | カテゴリータグ           | category_tag          | 文字列   |             |
| 属性           | カテゴリータグ ID        | category_tag_id       | 整数     | Primary Key |
| 属性           | 会員 ID                  | members_id            | 整数     | Foreign Key |
| 属性           | カテゴリータグ色         | category_tag_color    | RGB      |             |
| 属性           | カテゴリータグ名         | category_tag_name     | 文字列   |             |
| 属性           | カテゴリータグアイコン   | category_tag_icon     | 文字列   |             |
| 属性           | カテゴリータグ使用フラグ | category_tag_use_flag | 整数     |             |

| 役割           | 名称日本語                     | メソッド名                       | データ型 | キー設定    |
| -------------- | ------------------------------ | -------------------------------- | -------- | ----------- |
| エンティティ名 | 登録製品情報                   | registration_product_information | 文字列   |             |
| 属性           | 登録製品 ID                    | registration_product_id          | 整数     | Primary Key |
| 属性           | 写真 ID                        | photo_id                         | 整数     | Foreign Key |
| 属性           | 作品シリーズ ID                | works_series_id                  | 整数     | Foreign Key |
| 属性           | 作品 ID                        | works_id                         | 整数     | Foreign Key |
| 属性           | キャラクター ID                | character_id                     | 整数     | Foreign Key |
| 属性           | 版権会社 ID                    | copyright_company_id             | 整数     | Foreign Key |
| 属性           | 製品グループ ID                | product_group_id                 | 整数     | Foreign Key |
| 属性           | 製品サイズ ID                  | product_size_id                  | 整数     | Foreign Key |
| 属性           | 収納場所 ID                    | receipt_location_id              | 整数     | Foreign Key |
| 属性           | 収納場所タグ ID                | receipt_location_tag_id          | 整数     | Foreign Key |
| 属性           | カラータグ ID                  | color_tag_id                     | 整数     | Foreign Key |
| 属性           | カテゴリータグ ID              | category_tag_id                  | 整数     | Foreign Key |
| 属性           | キャンペーン ID                | campaign_id                      | 整数     | Foreign Key |
| 属性           | 貨幣単位 ID                    | currency_unit_id                 | 整数     | Foreign Key |
| 属性           | 作品シリーズ名                 | works_series_name                | 文字列   |             |
| 属性           | 作品名                         | title                            | 文字列   |             |
| 属性           | キャラクター名                 | character_name                   | 文字列   |             |
| 属性           | 版権会社名                     | copyright_company_name           | 文字列   |             |
| 属性           | 製品の形                       | product_type                     | 文字列   |             |
| 属性           | 製品サイズ横                   | product_size_horizontal          | 整数     |             |
| 属性           | 製品サイズ奥行                 | product_size_depth               | 整数     |             |
| 属性           | 製品サイズ縦                   | product_size_vertical            | 整数     |             |
| 属性           | バーコード番号                 | barcode_number                   |          |             |
| 属性           | バーコードタイプ               | barcode_type                     |          |             |
| 属性           | 製品名                         | product_name                     | 文字列   |             |
| 属性           | 定価                           | list_price                       | 整数     |             |
| 属性           | 購入価格                       | purchase_price                   | 整数     |             |
| 属性           | 登録数量                       | registration_quantity            | 整数     |             |
| 属性           | 販売希望数量                   | sales_desired_quantity           | 整数     |             |
| 属性           | 製品シリーズ数量               | product_series_quantity          | 整数     |             |
| 属性           | 購入場所                       | purchase_location                | 文字列   |             |
| 属性           | おまけ名                       | freebie_name                     | 文字列   |             |
| 属性           | 購入日                         | purchase_date                    | 日付     |             |
| 属性           | 作成日                         | creation_date                    | 日付     |             |
| 属性           | 更新日                         | updated_date                     | 日付     |             |
| 属性           | その他タグ                     | other_tag                        | 文字列   |             |
| 属性           | メモ                           | memo                             | 文字列   |             |
| 属性           | 製品シリーズフラグ             | product_series_flag              | 整数     |             |
| 属性           | 製品シリーズコンプリートフラグ | product_series_complete_flag     | 整数     |             |
| 属性           | 商用製品フラグ                 | commercial_product_flag          | 整数     |             |
| 属性           | 同人製品フラグ                 | personal_product_flag            | 整数     |             |
| 属性           | デジタル製品フラグ             | digital_product_flag             | 整数     |             |
| 属性           | 販売希望フラグ                 | sales_desired_flag               | 整数     |             |
| 属性           | 欲しい物フラグ                 | want_object_flag                 | 整数     |             |
| 属性           | おまけ付きフラグ               | flag_with_freebie                | 整数     |             |

| 役割           | 名称日本語  | メソッド名       | データ型 | キー設定    |
| -------------- | ----------- | ---------------- | -------- | ----------- |
| エンティティ名 | 貨幣単位    | currency_unit    | 文字列   |             |
| 属性           | 貨幣単位 ID | currency_unit_id | 整数     | Primary Key |
| 属性           | 貨幣名      | currency_name    | 文字列   |             |

# エラー対策

## エラー 1 個目

pyzbar が依存する zbar を Render にインストールさせるため、プロジェクト直下に apt.txt を作成して以下を記載します：

```
libzbar0
libzbar-dev
```

## エラー 2 個目

Flask Dash は内部で Flask を使っていますが、Render での依存解決を安定させるために明示的に書いておくと安心です。

gunicorn Render は本番環境で python app.py ではなく WSGI サーバーを使うのが推奨です。 → gunicorn app:app のように起動することで安定稼働します。

Procfile の基本
ファイル名は必ず Procfile（拡張子なし）

アプリのルートディレクトリに置く必要があります

中身は「プロセスタイプ: 実行コマンド」という形式で書きます

例（Dash アプリの場合）：

コード
web: gunicorn app:server
✅ どういう意味？
web: → 「Web サーバーとして動かすプロセス」という意味。外部からの HTTP リクエストを受け付けるのはこのプロセスだけです。

gunicorn app:server → gunicorn という本番用 WSGI サーバーを使って、app.py 内の server という Flask インスタンスを起動する、という指示。 Dash アプリでは通常こう書きます：

python
app = dash.Dash(**name**)
server = app.server # ← これを定義しておく

## エラー 3 個目

【解決方法の可能性】⇒ 表示されず
registration-store を同じプロパティで更新するコールバックが複数あるため、最初のコールバック（バーコード処理側）の Output("registration-store", "data") に allow_duplicate=True を設定しました。Dash では同一 Output を複数コールバックで扱う際にこれを明示しないとアプリ起動時に DuplicateCallbackOutput エラーで画面が描画されません [^dash]。今回表示されなかった原因はこの設定漏れです。
【写真を登録画面のエラー解決策】
sync_tag_checklist と add_custom_tag の両方で tag-checklist（options/value）に出力していたため、Dash の「DuplicateCallbackOutput」保護機構が働き、/register ページのみ 500 エラーで空白表示になっていました。
allow_duplicate=True を追加し、双方のコールバックで同じ Output を扱えるように修正しました。
既存の registration-store に対する複数更新も同様に allow_duplicate=True を設定済み。
【今回の根本的な解決策】
修正しました。問題は、components/sections/barcode_section.py と components/sections/front_photo_section.py で dcc.Upload コンポーネントに無効なキーワード引数 \*\*{"data-camera-upload": "barcode"} を渡していたため、TypeError が発生していました。これにより render_register_page() が例外を投げ、ページが表示されていませんでした。
dcc.Upload は data- 属性を受け付けないため、これを削除しました。JavaScript は id から判断して動作します。

# コールドバック（ページ遷移エラー）の改善策

## 基本的な注意点

### 1.ID の重複・未定義

- Dash では、全てのコンポーネント ID が一意である必要がある
- 複数ページや動的生成で同じ ID を使うと、コールバックが壊れます  
  【対策】
- ID にプレフィックスを付ける
- 動的生成時は、MATCH や ALL 型のコールバックを使用する

### 2.ページ遷移時の状態保持・初期化不足

- ページを切り替えると前のページのコンポーネントが消えるため、コールバックがエラーになります  
  【対策】
- dcc.Location + dcc.Store を使って、状態を保持
- ページごとにレイアウトを分けて、コールバックを分離

### 3.コールバックの依存関係が複雑すぎる

- 多数の INPUT や state を使うと、更新順序が不明確になり、エラーが出やすくなる  
  【対策】
- コールバックを小さく分割して、機能ごとに整理
- prevent_initial_call = True を使って、初期状態読み込み時のエラーを防止

### 4.コールバックの依存関係が壊れている

- 階層追加後に Output や Input の対象が存在しないと Dash がエラーを出してページ描画を止めてしまう  
  【対策】
- 自動範囲は、dcc.Location の href を更新する

### 5.dcc.Location の更新が正しく反映されていない

- ページ遷移に使う dcc.Location の pathname を更新しても、対応するレイアウトが返さないと、空白ページになります

### 6.ページレイアウトが None になっている

- 自動遷移後に layout が空になってしまうと、ページが表示されない  
  【対策】
- ページ毎にレイアウトを関数に定義する

## API 抽出情報を項目毎に自動で反映する時の注意点

### 1.抽出結果を反映するタイミングが早すぎる

- ページがまだ描画されていない状態で、API の結果を反映しようとするとエラーになります  
  【対策】
- prevent_initial_call = True を使って、初期読み込み時のコールバックを防ぐ
- dcc.Store に一度、API 結果を保存 ⇒ ページ描画後に安全に反映

### 2.ページ描画後にタグを反映するコールバックを分離

- dcc.Location の pathname を監視して、ページが表示された後に dcc.Store の内容を反映するようにする

### 3.prevent_initial_call = True を活用

- 初期描画時にコールバックが走らないようにすることで、未描画エラーを防ぎます

### さらに安定：dcc.Interval で遅延反映

- ページ描画後に少し待ってから、タグを反映することで、描画タイミングのズレを抽出できます。
