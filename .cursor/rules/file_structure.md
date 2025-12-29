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
    - componets.py # UI 断片（ページ固有の UI）
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
- Cursor.md # Cursor が修正した内容説明
- cursor_error.md # Cursor と開発者の共同エラー解決記録
- .gitignore
- Dockerfile # Render の起動に必要。Python だけでは、写真が無理だった。
- supabase #使用する可能性があるので、残す。簡易 DB

# 注意事項

- 他に必要なファイルがあれば、残してください
- 不要なファイルやフォルダは、開発者に確認後に消去してください
- フレームワークの Dash 公式のページ機能とコールバックを参照して、エラーが出ないようにファイル分けしてください[https://dash.plotly.com/urls?from_column=20423&from=20423](https://dash.plotly.com/urls?from_column=20423&from=20423)
- UI とロジックは、ファイルを機能別に 1 機能ずつ分けてください
- 将来的にフロントエンド：React(Next.js) + バックエンド：Python にできるようなファイル構成にしてください

# サイトマップ

- /（ホーム）
  - 定義: pages/home.py
- /register/barcode（登録 STEP1: バーコード）
  - 定義: pages/register/barcode.py
  - /register/photo（登録 STEP2: 正面写真）
    - 定義: pages/register/photo.py
  - /register/review（登録 STEP3: 確認・登録）
    - 定義: pages/review.py
- /gallery（ギャラリー）
  - 定義: pages/gallery/index.py
  - /gallery（ギャラリー：詳細ページ）
  - 定義: pages/gallery/detail.py
- /dashboard（ダッシュボード）
  - 定義: pages/dashboard.py
- /settings（設定）
  - 定義: pages/settings.py

# 複雑なページ遷移詳細

## ギャラリー関連

URL: /gallery/detail?registration_product_id=<id>&view=<thumb|list>
クリック挙動: pages/gallery/index.py（現ギャラリー）で、クリック時に \_pages_location.pathname と \_pages_location.search を更新して詳細へ遷移
詳細ページ: pages/gallery/detail.py で query を読み取り、Supabase から該当 registration_product_information を photo(...) 付きで取得して表示
戻る導線: 詳細ページの先頭に href="/gallery?view=<...>" の戻る矢印ボタンを配置
