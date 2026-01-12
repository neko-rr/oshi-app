# このファイルは Cursor への指示用です。【このファイルの内容を修正禁止】

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
| 属性           | ログインの種類    | identity_type      | 文字列         |             |

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

# 命名規則

スネークケース
