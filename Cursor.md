# Cursor メモ

## 目的

- 写真管理アプリ (Dash) をフレームワーク非依存な構造に整理。
- UI とロジックを `components/` / `services/` に分離して、将来 React / Flask 等へ移植しやすくした。
- Supabase を簡易 DB として扱うが、利用しない場合でも UI が動くように防衛コードを追加。

## 主な変更

- `components/` にレイアウト・ページ・登録セクションを分割。
- `services/` に Supabase 接続とバーコード解析・写真保存処理を関数化して配置。
- CSS / JavaScript を `assets/` へ移動 (`styles.css`, `camera.js`)。Dash の自動ロード機能を利用。
- `app.py` はルーティングとコールバックのハブのみ担当。UI は Components、データ処理は Services を呼び出す構造。
- `data/products.json` など spec.md が示すフォルダを準備。
- README をユーザー向けに刷新。旧 README/QUICKSTART は統合済み。
- 製品登録フロー STEP1 (バーコード) / STEP2 (正面写真) を UI / Service に切り分け。
  - `components/sections/barcode_section.py` / `front_photo_section.py`
  - `services/barcode_lookup.py` で楽天 API を利用した照合ロジックを実装
  - `assets/camera.js` をデータ属性ベースの汎用処理に改修し、複数カメラグループ対応
- Rakuten Ichiba API を使ったバーコード検索（`services/barcode_lookup.py`）と、IO Intelligence API での画像説明生成（`services/io_intelligence.py`）を実装。バーコード照合失敗時は説明文から再検索するフローを `app.py` の STEP1/STEP2 に組み込み。
- Review ステップ(微調整)を追加。`components/sections/review_section.py` でタグチェックリスト／メモ入力／最終登録ボタンを用意し、`app.py` でタグ追加やサマリ表示、保存ロジックを拡張。`registration-store` の初期値とタグ抽出 (`services/tag_extraction.py`) を組み合わせてワークフロー全体を連携。
- `registration-store.data` を複数のコールバックで更新する際は `allow_duplicate=True` を明示し、Dash の DuplicateCallbackOutput エラー（ページが描画されない原因）を防止。同様にチェックリスト同期・追加の双方で `allow_duplicate=True` を指定して重複出力を許可。

## Supabase まわり

- `.env` が未設定でも動作し、警告表示のみ。
- 将来別 DB へ差し替える場合は `services/photo_service.py` と `supabase_client.py` の実装を置き換えれば良い。

## TODO 候補

- services 層に楽天 API / タグ抽出など spec で求められている機能を追加。
- Supabase を使わないローカル JSON / SQLite ストレージ実装の検証。
- Dash から別フレームワーク (FastAPI + React 等) へ移行する際は Components をテンプレート化して再利用。

## 注意点

- `spec.md` は仕様書なので編集禁止。
- 外部サービス (GitHub/Render) へのデプロイはこの環境からは実行できない。利用時はローカルで実施すること。
