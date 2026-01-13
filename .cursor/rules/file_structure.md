# 基本品質基準（常時適用）

Apply Mode: Always Apply

# このファイルは Cursor への指示用です。【このファイルの内容を修正禁止】

# 最低限のファイル構成

- app.py # Dash エントリ(use_pages=True に変更)
- server.py # Flask(Supabase JWT 保護の入口)
- pages/ # ルーティング対象（登録+レイアウト+ページ固有 callback）
  - home.py
- features/ # 機能別モジュール（UI 断片・コールバックサービスの結合部）
  - barcode/
    - components.py # UI 断片（ページ固有の UI）
    - controller.py # コールバック(UI⇔services の橋渡し)
- components/ # 再利用可能なコンポーネント・UI 部分（ページ横断のナビ、ヘッダー、フッター、モーダル等）
  - layout.py # 全体レイアウト構成
- services/ # ロジック（API 呼び出し・照合処理など）※UI 非依存
  - barcode_service.py # バーコード解析
  - photo_service.py # 画像ストレージ・DB への CRUD
  - barcode_lookup.py # 楽天 API などでバーコード照合
  - tag_extraction.py # タグ抽出処理
- assets/ # CSS や画像などの静的ファイル
  - styles.css # デザイン調整用 CSS
  - camera.js
- tests/ # テストコードの全てをまとめる
- .cursor/
  - rules/ # cursor への指示
    - file_structure.md # フォルダ構成指示
    - spec.md # Cursor に伝えるようの仕様書
    - database_configuration.md # データベース構成指示
- requirements.txt # 使用ライブラリ一覧（Python レベル）
- .env # API キーなどの環境変数
- .env.example # API キーなどの環境変数テンプレート
- README.md # プロジェクト説明・使い方・構成
- cursor.md # Cursor が修正した内容説明
- cursor_error.md # Cursor と開発者の共同エラー解決記録
- .gitignore
- Dockerfile # Render の起動に必要。Python だけでは、写真が無理だった。
- supabase #使用する可能性があるので、残す。簡易 DB

# 注意事項

- 他に必要なファイルがあれば、残してください
- 不要なファイルやフォルダは、開発者に確認後に消去してください
- フレームワークの Dash 公式のページ機能とコールバックを参照して、エラーが出ないようにファイル分けしてください
  - [https://dash.plotly.com/urls?from_column=20423&from=20423](https://dash.plotly.com/urls?from_column=20423&from=20423)
  - [https://dash.plotly.com/advanced-callbacks](https://dash.plotly.com/advanced-callbacks)
- Dash Pages の制約（コールバックが“存在しない ID”を参照できない） と、Supabase Auth/Storage の仕様（Private+signed URL） が差分を生んでいる。注意して、判断するように。
- UI とロジックは、ファイルを機能別に 1 機能ずつ分けてください
- 将来的にフロントエンド：React(Next.js) + バックエンド：Python にできるようなファイル構成にしてください

# Storage の設定

Storage は Private bucket + signed URL、DB には public URL ではなく object path を保存する仕様になった  
理由

- Private にすると「URL を直接貼るだけ」では表示できません。
- そのため photo_service.py に「object path → signed URL」変換処理が入り、アプリ側の責務が増えました。

# サイトマップ

- /（ホーム）
  - 定義: pages/home.py
- /gallery（ギャラリー）
  - 定義: pages/gallery/index.py
  - /gallery（ギャラリー：詳細ページ）
  - 定義: pages/gallery/detail.py
- /dashboard（ダッシュボード）
  - 定義: pages/dashboard.py
- /settings（設定）
  - 定義: pages/settings.py
  - /settings（設定：カラータグの設定）
  - 定義: pages/gallery/settings_color_tags.py

## サイトマップの登録分岐詳細＆複雑なページ遷移詳細

- /register/select （グッズ登録（クイック追加：写真撮影のみ）」「グッズ登録（写真・タグ付け）」「書籍登録」の分岐 UI）

### 【グッズ登録（クイック追加：写真撮影のみ】select→barcode→photo→ 写真保存 → 成功表示 →/register/barcode に戻る（連続登録）

- /register/barcode（登録 STEP1: バーコード）
  - 定義: pages/register/barcode.py
- /register/photo（登録 STEP2: 正面写真）
  - 定義: pages/register/photo.py

### 【グッズ登録（写真・タグ付け）】select→barcode→photo→review→ 成功表示

- /register/barcode（登録 STEP1: バーコード）
  - 定義: pages/register/barcode.py
- /register/photo（登録 STEP2: 正面写真）
  - 定義: pages/register/photo.py
- /register/review（登録 STEP3: 確認・登録）
  - 定義: pages/register/review.py

### 書籍登録【準備中】select→

# 複雑なページ遷移詳細

## ギャラリー関連

URL: /gallery/detail?registration_product_id=<id>&view=<thumb|list>
クリック挙動: pages/gallery/index.py（現ギャラリー）で、クリック時に \_pages_location.pathname と \_pages_location.search を更新して詳細へ遷移
詳細ページ: pages/gallery/detail.py で query を読み取り、Supabase から該当 registration_product_information を photo(...) 付きで取得して表示
戻る導線: 詳細ページの先頭に href="/gallery?view=<...>" の戻る矢印ボタンを配置
