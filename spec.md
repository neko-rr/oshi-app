# このファイルは Cursor への指示用です。修正しないで下さい。

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
  - products.json # 登録されたグッズ情報
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

# 機能要件

- 【絶対必要】
  - スマホ画面対応
  - 推し色に合わせたカラー対応（背景とかアイコンとか）
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

## 製品登録のフロー（利用者画面では 1⇒2⇒6 の画面で進んでいきます）

製品は、グッズから漫画、書籍まで、何が登録されるか分かりません。 1.バーコードの読み取り or アップロード or バーコード番号の入力

- barcode_service.py と photo_service.py に該当
- 1 ページ内の表示の順番は上から、読み取り ⇒ アップロード ⇒ バーコード番号の入力の順
- 写真の読み取り時は、撮影中のライブビューイングがあるようにしてください
- スキップする選択肢もボタンで用意する事
- 情報を全て手動入力する選択肢ボタンも作成してください。
- Output：バーコード情報を楽天 API に渡す（撮影した写真は、登録しない）
- IF：バーコード読み取りに失敗した場合は、「もう一度挑戦する」or「スキップ」の 2 択を選べるようにしてください。 2.正面写真の登録（アップロード or 撮影）
- ファイルは、関数化してください（写真の登録は、一覧に追加してからも関連写真として、追加できるようにするため、何度も使用機会があります）
- スキップする選択肢もボタンで用意する事
- 写真の読み取り時は、撮影中のライブビューイングがあるようにしてください。
- この写真は、保存して、後で登録グッズの一覧画像で使用します。また、後でその写真を飾り付けたりにも使用します。
- 最初のこの製品登録の際は、「正面写真」のみに限定します。可能な限り、アップで正面写真を撮ってもらうようにしてください。 3.上記 1 のバーコード情報を楽天 API で照合して、製品情報を抽出
- barcode_lookup.py に該当
- Input：上記 1 のバーコード情報
- Output：製品情報（登録情報・タグ付けに使用）
- IF：失敗した場合は、利用者に知らせる通知は不要。そのまま 4 の手順に進むだけ。成功しても 4 の手順に進みます。 4.上記の 2 の写真を IO Intelligence API で画像内容を説明 ⇒IF.上記 3 が失敗した場合、テキストベースで楽天 API で照合
- image_description.py に該当
- IO Intelligence API(Vision モデル：例 LLaVA 系)は、絶対に使用してください。
- 参考（精度が上がるならば検討してください）：CLIP（画像 ⇒ テキスト特徴抽出：ベクトル化）、FAISS(類似検索)
- Input：上記 2 の写真
- Output：製品情報（登録情報・タグ付けに使用）
- IF：上記 3 失敗時の照合は、写真からテキスト化した情報を楽天 API 検索等からお願いします。上記 3 が成功していた場合は、写真のテキスト化のみです。
- 精度向上の参考：解像度の統一・トリミング（主題を中央に配置）・ノイズ除去＆露出補正
- Output：製品情報（登録情報・タグ付けに使用） 5.上記 3 の製品情報と上記 4 の製品テキスト情報からタグ抽出
- tag_extraction.py に該当
- 参考：IO Intelligence API(LLM)、spaCy や KeyBERT(タグ抽出)
- 上記 3 と 4 の製品情報から、登録するためのタグを抽出
- 上記 1 と 2 の両方をスキップした場合は、製品情報が無いため、手順 6 の画面に移動して、全てを利用者が入力できるようにしてください。 6.ユーザーによる微調整
- 照合した結果を表示して、利用者が微調整できるようにしてください。
- 登録ボタンを表示して、登録を実行してください。
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
  -H "Authorization: Bearer $IOINTELLIGENCE_API_KEY" \
  -d '{
    "model": "openai/gpt-oss-120b",
    "messages": [{"role":"user","content":"Say this is a test"}],
    "temperature": 0.7
  }'
```

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
