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

## 今回の開発で直面した問題と解決策

### 1. ページ遷移の問題

**問題**: 写真アップロード後にレビュー画面に遷移しない
**原因**: URL 変更がクライアントサイドで即座に反映されない
**解決策**: registration-store の状態変更をトリガーにして URL 変更を行うコールバックを実装

### 2. Dash コンポーネントの属性エラー

**問題**: `dcc.Checklist`に`disabled=True`属性を設定すると TypeError が発生
**原因**: Dash の Checklist コンポーネントに disabled 属性が存在しない
**解決策**: CSS スタイル(`pointerEvents: "none"`, `opacity: "0.6"`)で編集不可を実現

### 3. 状態管理の問題

**問題**: display_page 関数で registration-store が常にリセットされる
**原因**: `/register`ページアクセス時に常に空の状態を設定していた
**解決策**: 既存の registration-store データがある場合はリセットせず維持

### 4. 保存機能の変数未定義エラー

**問題**: save_registration 関数で未定義の変数を使用
**原因**: UI 変更時に古い変数参照が残っていた
**解決策**: 新しい UI のフィールド（other_tags, memo）を使用するように修正

### 5. コールバック実行順序の問題

**問題**: 複数のコールバックが同時に実行されて競合
**原因**: registration-store の更新が複数のコールバックをトリガー
**解決策**: `allow_duplicate=True`を適切に使用し、コールバックの実行順序を考慮

### 6. Supabase RLS (Row Level Security) エラー

**問題**: データベース保存時に「new row violates row-level security policy」エラー
**原因**: Supabase のテーブルで RLS が有効になっており、適切なポリシーが設定されていない
**解決策**: SQL Editor で RLS を無効化する

```sql
ALTER TABLE photo DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_product_information DISABLE ROW LEVEL SECURITY;
```

### 改善点

- URL 変更よりも状態変更ベースのページ遷移の方が安定
- デバッグログの追加で問題特定が容易に
- CSS ベースの UI 制御でコンポーネント属性の制約を回避
- コールバックの State 管理を徹底的に確認
- Supabase RLS 設定の重要性を理解

## 2025-11-08 フォルダ整理メモ

- Supabase 関連ファイルは `supabase/docs`（ガイドのテキスト）と `supabase/sql`（SQL スクリプト）に再配置。`supabase/migrations` は従来どおり保持。
- ルート直下にあったテストスクリプトを `tests/` に集約し、パッケージ初期化用の `tests/__init__.py` を追加。
- `.dockerignore` を作成し、`venv/` やローカル DB、ログ類など Docker イメージに不要なファイルを除外。
- デプロイ用途の Docker は `Dockerfile` を使用。ローカル検証でのみ `docker-compose.yml` を利用。Render 起動コマンドは既存の `Procfile` を継続使用。

### アプリ起動方法メモ

- **ログ付き強制起動（PowerShell）**  
  `powershell -ExecutionPolicy Bypass -File .\start_with_logs.ps1`  
  ※ 起動前に既存プロセスやポート 8050 を解放し、`app_run.log` に出力を保存。
- **通常起動（開発確認用）**  
  `python app.py`  
  ※ 環境変数を設定した PowerShell / venv 上で実行。終了は `Ctrl+C`。
