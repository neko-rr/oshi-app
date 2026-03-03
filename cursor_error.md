# Cursorから開発者へのメモ：エラー版

## エラー 1 個目

pyzbar が依存する zbar を Render にインストールさせるため、プロジェクト直下に apt.txt を作成して以下を記載します：

```
libzbar0
libzbar-dev
```

## エラー 2 個目

Flask Dash は内部で Flask を使っていますが、Render での依存解決を安定させるために明示的に書いておくと安心です。

gunicorn Render は本番環境で python app.py ではなく WSGI サーバーを使うのが推奨です。 → Dash の場合は `server = app.server` を公開し、`gunicorn app:server` のように起動することで安定稼働します。

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

### 3-1. DuplicateCallbackOutput（同一 Output を複数 callback が更新）

registration-store や checklist など、同じコンポーネントの同じプロパティを複数 callback で更新する場合、Dash の保護機構により起動時エラーや 500/空白表示になることがあります。

【対策】

- 同一 Output を複数 callback が更新する必要がある場合は、該当 Output に `allow_duplicate=True` を付ける
- `prevent_initial_callbacks="initial_duplicate"` 等と組み合わせて、初期発火の競合を避ける

### 3-2. dcc.Upload へ無効な属性を渡してレイアウトが例外で落ちる

【原因】

- `dcc.Upload(...)` に `data-` 属性など、Dash コンポーネントが受け付けないキーワード引数を渡すと `TypeError` になり、ページの `layout` 生成自体が失敗して空白表示になります

【対策】

- `dcc.Upload` には無効な属性を渡さない（必要な `data-` 属性は `html.*` 側に付ける）

## エラー 4 個目（今回）: /register の自動遷移が動かない（スキップしても進まない）

【症状】

- STEP1/STEP2 で「スキップ」「アップロード成功」「撮影成功」をしても、次のページに自動遷移しない
- ログ上は callback が遷移先パスを返しているのに画面が切り替わらない

【原因（根本）】

- Dash Pages（`use_pages=True`）は内部の `dcc.Location(id="_pages_location")` の `pathname` 変化をトリガーに `dash.page_container` を更新します
- 以前は独自の `dcc.Location(id="nav-redirect")` を更新していたため、Pages 側が反応せず「返しているのに遷移しない」状態になっていました

【対策（今回の改善）】

- 自動遷移の Output 先を **`Output("_pages_location", "pathname")` に統一**する
- 競合/混乱を避けるため、`nav-redirect` 用 `dcc.Location` は削除する
- `debug=False` のときはホットリロードされないため、修正反映にはサーバー再起動が必要

# コールバック（ページ遷移エラー）の改善策

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
- 未描画/未存在のタイミングでは更新しない（`PreventUpdate` / `dash.no_update` を使う）

### 5.dcc.Location の更新が正しく反映されていない

- ページ遷移に使う dcc.Location の pathname を更新しても、対応するレイアウトが返さないと、空白ページになります
  【対策】
  - Dash Pages を使っている場合は `_pages_location.pathname` を更新する（独自 Location を更新しても `dash.page_container` は反応しない）

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
