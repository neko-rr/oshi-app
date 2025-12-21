# 開発者向けメモ（最新仕様・起動手順）

## 現状と重要ポイント

- Dash Pages 多ページ構成。登録フロー: `/register/barcode` → `/register/photo` → `/register/review`
- ページ遷移は独自の `dcc.Location(id="nav-redirect")` に pathname を書き込んで実施（バーコード/写真コールバックがここに出力）。Dash 内部の `_pages_location` は Pages 用に存在するが遷移には使わない。
- UI/ロジック分離: `components/`（UI）、`services/`（API・処理）、`assets/`（CSS/JS）。`spec.md` は編集禁止。
- Supabase は任意設定。未設定でも UI 起動可だが保存/ギャラリーは無効。

## 起動手順（必ず残す）

### 通常起動

```powershell
cd C:\Users\ryone\Desktop\oshi-app
python app.py
```

### ログ付き強制起動（PowerShell）※依頼されたら必ずこれを使う

```powershell
cd C:\Users\ryone\Desktop\oshi-app
powershell -ExecutionPolicy Bypass -File .\start_with_logs.ps1
```

- 既存 python/ポート 8050 を停止し、UTF-8・アンバッファで `python app.py` を実行。ログは `app_run.log`。
- `.venv` を優先利用（スクリプト内検索順）。`.venv` が無ければ環境に応じて Python を探索。
- ログ確認: `Get-Content app_run.log -Tail 50`

### ブラウザ確認

- `http://127.0.0.1:8050`（ハードリロード推奨: Ctrl+Shift+R）

## ページ遷移仕様

- バーコード: 成功/スキップで `nav-redirect.pathname = "/register/photo"`
- 正面写真: 成功/スキップで `nav-redirect.pathname = "/register/review"`
- 重複出力は `allow_duplicate=True` を付与（registration-store 等）。

## Supabase / 環境変数

- `.env` に `SUPABASE_URL`, `SUPABASE_KEY`, `IO_INTELLIGENCE_API_KEY`, `RAKUTEN_APP_ID` 等を設定。未設定でも UI は起動（保存は無効）。
- RLS エラー時はポリシー確認（開発中は RLS 無効化が早い）。

### Supabase 接続確認（ローカル）

- **DB/Storage まで含めて一発で切り分ける**: `python .\scripts\check_supabase.py`
  - **JSON で見たい**: `python .\scripts\check_supabase.py --json`
  - **書き込み確認（安全なテスト行）**: `python .\scripts\check_supabase.py --write`
- **判定の目安**
  - `db.*.ok=False` で error が `permission denied` 系 → **RLS/ポリシー**の可能性が高い
  - `db.*.ok=True` で `rows=0` → **権限は OK だがデータ 0 件**
  - `storage.photos_list.ok=False` → **Storage ポリシー/バケット/キー**の可能性

## デプロイ（Render/Docker）

- `Dockerfile`（python:3.11-slim, libzbar0, gunicorn app:server, PORT=8050）。
- `docker-compose.yml` はローカル検証用。Render では `Procfile` / `render.yaml` 利用。

## 仮想環境

- `.venv` と `venv` が共存。`start_with_logs.ps1` は `.venv` を優先。統一したい場合はスクリプト内の検索順を調整。

## トラブルシュート

- 遷移しない: `nav-redirect` への pathname 出力がブロックされていないか、ブラウザコンソール赤エラーと `/_dash-update-component` のレスポンスを確認。広告/セキュリティ系拡張がブロックする場合あり。
- Supabase 取得エラー: Network タブで `supabase.co` へのリクエスト失敗内容（ステータス/本文）を確認し、キー/RLS を見直す。
- カメラ不具合: `assets/camera.js` がロードされているか、ブラウザのカメラ許可を確認。

## 主要ディレクトリ概要

- `app.py`: Dash エントリ。`nav-redirect` による遷移、テーマ適用、コールバック登録。
- `components/`: レイアウト・各ページ・セクションの UI。
- `services/`: バーコード解析、Supabase、タグ抽出、画像説明生成などの処理。
- `assets/`: `styles.css`, `camera.js`（自動ロード）。
- `supabase/`: SQL, migrations, ガイド。
- `start_with_logs.ps1`: ログ付き強制起動スクリプト（必ず保持）。

## 起動依頼時のルール

- 「ログ付き強制起動で」と指示されたら、必ず `powershell -ExecutionPolicy Bypass -File .\start_with_logs.ps1` で起動すること。
- 必要に応じて起動前に `Stop-Process -Name python -ErrorAction SilentlyContinue` で既存プロセスを停止。

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

#### ログ付き強制起動の具体的な手順

1. **ターミナルを開く**
   - Windows の **「Windows PowerShell」** を使用する（`cmd.exe` ではなく PowerShell 推奨）。
2. **プロジェクトフォルダに移動する**
   - まだ移動していない場合は、PowerShell で次を実行する:  
     `cd C:\Users\ryone\Desktop\oshi-app`
3. **強制ログ付きで起動するコマンドを実行**
   - 同じ PowerShell から次のコマンドを入力して実行する:  
     `powershell -ExecutionPolicy Bypass -File .\start_with_logs.ps1`
   - 既に PowerShell 上にいて、実行ポリシーの変更が不要な場合は、より簡単に:  
     `.\start_with_logs.ps1`
4. **起動結果の確認**
   - **ブラウザでの確認方法**:
     - 任意のブラウザ（Chrome, Edge, Firefox など）を開く。
     - アドレスバーに `http://127.0.0.1:8050` と入力して Enter キーを押す。
     - または、ブラウザの新しいタブで `localhost:8050` と入力しても同じ。
     - **期待される表示**: 「おしごとアプリ」というタイトルのダッシュボードページが表示される。
     - **正常起動の兆候**: 「ホーム」「写真を登録」「ダッシュボード」「設定」のナビゲーションメニューが表示される。
   - **ログファイルの確認**:
     - 同時に、`app_run.log` に起動ログが追記される（エラー調査時はこのファイルを確認する）。
     - PowerShell で `Get-Content app_run.log -Tail 10` を実行して最新のログを確認可能。

#### ログ付き強制起動で使われる主な設定ファイル

- **`.env`**
  - **役割**: Supabase の URL/キー、IO Intelligence API キー、Rakuten API キーなどの**環境変数**を定義する。
  - **使用箇所**: `app.py` の先頭で `dotenv.load_dotenv()` により読み込まれ、Supabase クライアントや外部 API 設定に利用される。
- **`theme.txt`**
  - **役割**: 使用中の Bootstrap テーマ名（例: `minty`）を 1 行だけ保存する。
  - **使用箇所**: `app.py` の `load_theme()` で読み込まれ、起動時に適用するテーマ CSS が決まる。
- **`start_with_logs.ps1`**
  - **役割**: 上記 `.env` や `theme.txt` を使う `app.py` を、**UTF-8・アンバッファリング・詳細ログ付き**で起動する PowerShell スクリプト。
  - **挙動**: 既存の `python` プロセスを停止し、必要な環境変数（ビジョンモデル関連など）を補完しつつ `python app.py` を実行し、その標準出力を `app_run.log` に書き出す。
- **`app_run.log`（出力ファイル）**

  - **役割**: 起動時・実行中のログを保存するテキストファイル。設定ファイルではないが、ログ付き強制起動時に毎回新しいヘッダをつけて作り直される。

- **通常起動（開発確認用）**  
  `python app.py`  
  ※ 環境変数を設定した PowerShell / venv 上で実行。終了は `Ctrl+C`。

## 2025-11-29 ファイル・フォルダ使用状況と削除可否メモ

※ この一覧は「ルート直下に見えている主なファイル・フォルダ」の説明です。  
※ `.git` などの隠しフォルダは省略していますが、**バージョン管理用なので削除・変更しないこと**をおすすめします。

### 1. アプリ本体に必須のもの（削除しない）

- **`app.py`**

  - **役割**: Dash アプリ本体。画面遷移・レイアウト・コールバックなどの中心となるファイル。
  - **削除可否**: **削除 NG**。これを消すとアプリ自体が起動できなくなります。

- **`components/` フォルダ**

  - **役割**: 画面のレイアウトや各ページ（ホーム・登録・レビューなど）、UI セクションをまとめたフォルダ。
  - **削除可否**: **削除 NG**。ここを消すと画面が表示できなくなります。

- **`services/` フォルダ**

  - **役割**: Supabase への保存、バーコード検索、タグ抽出など、データ処理や外部サービスとのやり取りをまとめたフォルダ。
  - **削除可否**: **削除 NG**。ここを消すと登録や検索などの機能が動かなくなります。

- **`assets/` フォルダ（`styles.css`, `camera.js` など）**

  - **役割**: 見た目（CSS）やカメラ関連 JavaScript を集めたフォルダ。Dash が自動で読み込む仕組みを使っています。
  - **削除可否**: **削除 NG を推奨**。削除するとデザイン崩れやカメラ機能の不具合が出ます。

- **`data/products.json`**

  - **役割**: 製品情報を保存するためのローカル JSON データ。仕様メモにも出てくる基本データです。
  - **削除可否**: **削除非推奨**。削除してもアプリは起動しますが、製品情報が失われる可能性があります。

- **`requirements.txt`**

  - **役割**: アプリに必要な Python ライブラリ一覧。環境構築に使います（`pip install -r requirements.txt`）。
  - **削除可否**: **削除非推奨**。再セットアップが難しくなるので残しておくのがおすすめです。

- **`spec.md`**
  - **役割**: アプリ全体の仕様書。何を作るか・どんな機能があるかの定義。
  - **削除可否**: **削除非推奨・編集も避ける**。上流仕様として参照専用にしておくのが安全です。

### 2. テーマ・ローカルデータ・設定系（基本は残す）

- **`theme.txt`**

  - **役割**: 使用中の Bootstrap テーマ名（例: `minty`）を保存する設定ファイル。`app.py` が読み込みます。
  - **削除可否**: **削除非推奨**。消すと起動時にデフォルトテーマに戻ります。壊れはしませんが、見た目が変わる可能性があります。

- **`demo_database.db`**

  - **役割**: ローカル環境で使う SQLite データベース。Supabase を使わない検証用のデータが入っている想定です。
  - **削除可否**: **慎重に**。削除すると中のデータがすべて消えます。不要であることを確認できる場合のみ削除候補になります。

- **`runtime.txt`**

  - **役割**: 一部のホスティング（例: Heroku 系）で Python バージョンを指定する設定ファイル。
  - **削除可否**: **削除非推奨**。将来クラウドにデプロイする際に役立つため、残しておくのがおすすめです。

- **`apt.txt`**
  - **役割**: Docker や一部の環境で追加インストールしたい OS レベルのパッケージ一覧をメモしているファイル。
  - **削除可否**: **削除非推奨**。将来の再構築時に「何を入れていたか」が分からなくなるため、メモとして残すのが安全です。

### 3. ログ・デバッグ・メモ類（アプリ動作には不要なので不要なら削除可）

- **`app_run.log`**

  - **役割**: `start_with_logs.ps1` でアプリを起動したときのログを溜めるファイル。エラー調査に使用。
  - **削除可否**: **不要になったら削除 OK**。削除してもアプリは再度ログファイルを作成できます。

- **`debug_log.txt` / `save_registration_debug.txt`**

  - **役割**: 登録処理などの動作確認用に出力したデバッグログ。問題調査の記録です。
  - **削除可否**: **不要になったら削除 OK**。過去のトラブルを振り返る必要が無ければ消して構いません。

- **`file_write_test.txt`**

  - **役割**: 「ファイル書き込みができるか」を確認するためのテスト結果メモ。
  - **削除可否**: **削除 OK**。同じテストが必要になればまた作れます。

- **`bucket_access_key_explanation.txt`**

  - **役割**: Supabase Storage のバケットアクセスキーに関する説明メモ。今は不要である旨も含まれています。
  - **削除可否**: **アプリ動作には不要なので削除可**ですが、学習・振り返り用に残しておくのも良いです。

- **`final_test_guide.txt`**

  - **役割**: 最終テストで何を確認するかをまとめたチェックリスト。
  - **削除可否**: **アプリ動作には不要なので削除可**。ただし、今後のテストの参考になるため取っておくと便利です。

- **`Cursor.md`（このファイル）**
  - **役割**: 開発メモ・構成メモをまとめたドキュメント。
  - **削除可否**: **削除非推奨**。動作には不要ですが、将来の自分や他人が構造を理解するのに役立ちます。

### 4. デプロイ・インフラ関連ファイル（使わないサービスだけ削除候補）

- **`Dockerfile` / `docker-compose.yml`**

  - **役割**: Docker でアプリを動かすための設定。`docker-compose.yml` では `demo_database.db` や `theme.txt` をコンテナにマウントします。
  - **削除可否**: Docker を使わない場合でも、**今後使う可能性があるなら残すのがおすすめ**。完全に Docker を使わないと決めた場合のみ削除候補です。

- **`Procfile` / `render.yaml`**

  - **役割**: Render などのクラウドサービス用の起動設定ファイル。`Procfile` は起動コマンドを定義します。
  - **削除可否**: 該当サービスを使わないなら **削除してもアプリ自体には影響なし**。ただし将来のデプロイ用に残しておくと便利です。

- **`setup.py` / `setup.sh`**

  - **役割**: パッケージ化や初期セットアップを自動化するためのスクリプト。
  - **削除可否**: **削除非推奨**。自動セットアップが使えなくなるため、特に理由がなければ残すのがおすすめです。

- **`start_with_logs.ps1`**
  - **役割**: Windows PowerShell からログ付きでアプリを起動する便利スクリプト。`app_run.log` に出力します。
  - **削除可否**: 使わない場合でも **残しておくとトラブル時に便利**。どうしても整理したい場合のみ削除候補です。

### 5. データベース・Supabase 関連（Supabase を使うなら残す）

- **`create_tables.py` / `apply_migration.py` / `check_database.py` など**

  - **役割**: データベースのテーブル作成・マイグレーション適用・状態確認を行うためのスクリプト群。
  - **削除可否**: **削除非推奨**。DB 構造を変更・再構築したくなったときに必要になります。

- **`supabase/` フォルダ（`docs/`, `migrations/`, `sql/`）**
  - **役割**: Supabase の設定ガイド、マイグレーション SQL、ポリシー設定などをまとめた重要な資料とスクリプト。
  - **削除可否**: Supabase を使う限り **削除 NG**。今は使っていなくても、将来の移行に備えて残しておくのがおすすめです。

### 6. テストコード・バックアップスクリプト（基本は残すが最悪削除可）

- **`tests/` フォルダ**

  - **役割**: 自動テスト（`test_*.py`）が入っているフォルダ。仕様どおりに動いているか確認するためのコード。
  - **削除可否**: **削除は可能だが非推奨**。テストができなくなり、将来的な改修時にバグを見つけにくくなります。

- **`app_backup.py` / `fix_app.py` / `fix_app_final.py` / `clean_app.py` など**

  - **役割**: 過去のバージョンや修正版を残したバックアップ・補助スクリプト。今の `app.py` を作る過程の記録です。
  - **削除可否**: **アプリ本番動作には不要なので削除可**ですが、万一の巻き戻しや学習用サンプルとして残しておくと安心です。

- **`__pycache__/` フォルダ**（ルートや `components/`, `services/` 内など）
  - **役割**: Python が自動生成するキャッシュ（`.pyc` ファイル）を入れるフォルダ。プログラムの実行を少し速くするためのもの。
  - **削除可否**: **いつ削除しても OK**。必要になれば Python が自動で再生成します。

### 7. 仮想環境 `venv/` について

- **`venv/` フォルダ**
  - **役割**: このプロジェクト専用の Python 実行環境（ライブラリ一式）が入っています。`Scripts/python.exe` や `site-packages/` などがここにあります。
  - **削除可否**: 理解がある場合は **削除しても OK** ですが、
    - 削除するとインストール済みライブラリがすべて消える
    - 再度 `python -m venv venv` と `pip install -r requirements.txt` で作り直す必要がある  
      ため、**初心者のうちは削除しないことを強くおすすめ**します。

### 8. そのほかの補足

- **`.git` フォルダや `.gitignore` などの隠しファイル**

  - **役割**: Git によるバージョン管理のための情報。変更履歴や無視するファイルのルールが入っています。
  - **削除可否**: **削除 NG**。これを消すと履歴や差分管理ができなくなります。

- **まとめ**
  - 「アプリ本体（`app.py`, `components/`, `services/`, `assets/`, データファイル）」は原則削除しない。
  - 「ログ・デバッグ・一部メモ」は、**内容を確認して不要と判断できれば削除して OK**。
  - 「インフラ設定・Supabase 関連・テストコード・仮想環境」は、将来の変更やトラブル対応に備えて **基本は残しておく**のが安全です。

## 2025-11-29 ファイル・フォルダ使用状況と削除可否メモ（ファイルツリー版）

※ `.git` や `.venv` 系などの隠しフォルダも含め、**フォルダ単位で中身をまとめて判断**しています。  
※ `venv/Lib/site-packages/` 内のライブラリ群などは数百ファイル以上あるため、**個々のファイル名ではなく「仮想環境の一部」として扱います**。

### ファイルツリー（プロジェクトルート）

```text
oshi-app/
  app.py
  app_backup.py
  app_run.log
  apply_migration.py
  apt.txt
  assets/
    camera.js
    styles.css
  bucket_access_key_explanation.txt
  check_database.py
  clean_app.py
  components/
    __init__.py
    __pycache__/
    layout.py
    pages/
      __init__.py
      __pycache__/
      barcode.py
      gallery.py
      home.py
      photo.py
      register.py
      review.py
      settings.py
    sections/
      __init__.py
      __pycache__/
      barcode_section.py
      front_photo_section.py
      review_section.py
  create_tables.py
  Cursor.md
  data/
    products.json
  debug_log.txt
  demo_database.db
  docker-compose.yml
  Dockerfile
  file_write_test.txt
  final_test_guide.txt
  fix_app_final.py
  fix_app.py
  Procfile
  README.md
  render.yaml
  requirements.txt
  runtime.txt
  save_registration_debug.txt
  services/
    __init__.py
    __pycache__/
    barcode_lookup.py
    barcode_service.py
    icon_service.py
    io_intelligence.py
    local_storage.py
    photo_service.py
    supabase_client.py
    tag_extraction.py
    tag_service.py
  setup.py
  setup.sh
  spec.md
  start_with_logs.ps1
  supabase/
    docs/
      supabase_operations_guide.txt
      supabase_policy_guide.txt
      supabase_storage_setup_guide.txt
      supabase_template_guide.txt
    migrations/
      20251023033822_create_photos_table.sql
      20251027194213_create_complete_database_schema.sql
      20251029030603_rename_products_to_registration_product_information.sql
      20251029034139_create_remaining_tables_and_clear_test_data.sql
      20251029034139_step1_clear_test_data.sql
      20251029034139_step2_create_missing_tables.sql
      20251029034139_step3_extend_registration_product_table.sql
      20251029034139_step4_setup_rls_and_indexes.sql
      20251029073606_recreate_registration_product_information.sql
      20251029211612_add_tag_icon_columns.sql
      20251029211613_insert_initial_tag_data.sql
      20251029212720_create_icon_tag_table.sql
      20251029212721_insert_initial_icons.sql
      20251030205033_add_product_series_complete_flag.sql
      20251031000001_add_product_group_name.sql
    sql/
      fix_storage_policy.sql
      storage_policies.sql
      supabase_policy_expanded.sql
      supabase_schema.sql
      supabase_setup.sql
      table_constraints_check.sql
      table_constraints_relax_fixed.sql
      table_constraints_relax.sql
  tests/
    __init__.py
    test_auto_fill.py
    test_insert.py
    test_save.py
    test_schema.py
    test_supabase.py
    test_table.py
  theme.txt
  venv/
    Include/
    Lib/
      site-packages/（多数のライブラリファイル）
    Scripts/
    etc/
    share/
    pyvenv.cfg
```

### ファイル・フォルダごとの要否一覧

凡例:

- **必須**: アプリの実行に実質必須。削除しない。
- **推奨**: なくても動くが、開発や運用のために残すことを強く推奨。
- **削除可**: アプリ本体の動作には不要。不要と判断できれば削除してよい。

#### ルート直下のファイル

- **`app.py`** … **必須**。Dash アプリ本体。
- 【削除済】**`app_backup.py`** … **削除可**。`app.py` のバックアップ／過去版。巻き戻し用途がなければ不要。
- **`app_run.log`** … **削除可**。ログファイル。不要になったら消してよい（再生成される）。
- **`apply_migration.py`** … **推奨**。Supabase など DB マイグレーション適用用スクリプト。将来のスキーマ変更に便利。
- **`apt.txt`** … **推奨**。Docker 等で入れた OS パッケージのメモ。環境再構築の参考。
- 【削除済】**`bucket_access_key_explanation.txt`** … **削除可**。Supabase Storage のアクセスキー解説メモ。アプリからは参照されない。
- **`check_database.py`** … **推奨**。DB 状態チェック用スクリプト。今後のトラブルシュートに役立つ。
- 【削除済】**`clean_app.py`** … **削除可**。整理・クリーニング用の補助スクリプト。現在の本番動作には不要。
- **`create_tables.py`** … **推奨**。テーブル作成スクリプト。DB を作り直す場合に必要。
- **`Cursor.md`** … **推奨**。この開発メモ。構造理解のために残しておくと良い。
- 【削除済】**`debug_log.txt`** … **削除可**。デバッグ時のログ。確認が終わっていれば削除可能。
- **`demo_database.db`** … **推奨**。ローカル SQLite データベース。中身のデータが不要と確信できるなら削除候補。
- **`docker-compose.yml`** … **推奨**。Docker で動かす設定。Docker を今後一切使わないと決めた場合のみ削除候補。
- **`Dockerfile`** … **推奨**。コンテナビルド用。クラウド移行や他環境で便利。
- 【削除済】**`file_write_test.txt`** … **削除可**。ファイル書き込みテスト結果。再テスト時に再作成可能。
- 【削除済】**`final_test_guide.txt`** … **削除可**。最終テストのチェックリスト。アプリ動作には不要だが、テスト手順メモとしては有用。
- 【削除済】**`fix_app_final.py`** … **削除可**。最終修正用スクリプトのバックアップ的なもの。歴史を残したい場合のみ保持。
- 【削除済】**`fix_app.py`** … **削除可**。修正過程のスクリプト。現行 `app.py` が安定していれば不要。
- **`Procfile`** … **推奨**。Render/Heroku 系の起動設定。そうしたサービスを使わないなら削除候補。
- **`README.md`** … **推奨**。利用者向けの説明。アプリ動作には不要だが絶対残すのがおすすめ。
- **`render.yaml`** … **推奨**。Render 用の設定ファイル。Render を使わない場合のみ削除候補。
- **`requirements.txt`** … **必須（事実上）**。依存ライブラリ一覧。環境再構築で必須。
- **`runtime.txt`** … **推奨**。Python バージョン指定。デプロイや再現性確保に役立つ。
- 【削除済】**`save_registration_debug.txt`** … **削除可**。登録処理のデバッグログ。不要なら消してよい。
- **`setup.py`** … **推奨**。パッケージ化・セットアップ用。将来の配布やインストールに便利。
- **`setup.sh`** … **推奨**。シェルでの初期セットアップを自動化するスクリプト。
- **`spec.md`** … **必須（仕様として）**。仕様書。編集は避け、削除もしない方がよい。
- **`start_with_logs.ps1`** … **推奨**。ログ付き起動スクリプト。トラブル調査時に有用。
- **`theme.txt`** … **推奨**。選択中テーマの保存ファイル。削除しても動くがテーマ設定がリセットされる。

#### `assets/` 配下

- **`assets/` フォルダ** … **必須**。Dash が静的ファイルを自動ロードする場所。
- **`assets/camera.js`** … **必須**。カメラ関連のフロントエンド処理。削除すると撮影 UI が壊れる。
- **`assets/styles.css`** … **必須**。全体のスタイル定義。削除すると見た目が大きく崩れる。

#### `components/` 配下

- **`components/` フォルダ** … **必須**。UI コンポーネント群。
- **`components/__init__.py`** … **必須**。パッケージとして `components` を認識させるため。
- **`components/layout.py`** … **必須**。共通レイアウト定義。
- 【削除済】**`components/__pycache__/`** … **削除可**。Python のキャッシュ。消しても自動再生成される。

`components/pages/`:

- **`components/pages/` フォルダ** … **必須**。各ページのレイアウト。
- **`components/pages/__init__.py`** … **必須**。ページパッケージとしての初期化。
- 【削除済】**`components/pages/__pycache__/`** … **削除可**。キャッシュ。
- **`components/pages/barcode.py`** … **必須**。バーコード入力ページ。
- **`components/pages/gallery.py`** … **必須**。ギャラリー表示ページ。
- **`components/pages/home.py`** … **必須**。ホーム画面。
- **`components/pages/photo.py`** … **必須**。写真アップロードページ。
- **`components/pages/register.py`** … **必須**。登録フローのページ。
- **`components/pages/review.py`** … **必須**。レビュー画面。
- **`components/pages/settings.py`** … **必須**。設定画面（テーマ変更など）。

`components/sections/`:

- **`components/sections/` フォルダ** … **必須**。ページ内の細かいセクションを切り出したもの。
- **`components/sections/__init__.py`** … **必須**。セクションパッケージ。
- 【削除済】**`components/sections/__pycache__/`** … **削除可**。キャッシュ。
- **`components/sections/barcode_section.py`** … **必須**。バーコード入力 UI セクション。
- **`components/sections/front_photo_section.py`** … **必須**。正面写真撮影セクション。
- **`components/sections/review_section.py`** … **必須**。レビュー用 UI セクション。

#### `services/` 配下

- **`services/` フォルダ** … **必須**。ビジネスロジック・外部サービス呼び出しを集約。
- **`services/__init__.py`** … **必須**。パッケージ初期化。
- **`services/__pycache__/`** … **削除可**。キャッシュ。
- **`services/barcode_lookup.py`** … **必須**。楽天 API などを使ってバーコードから商品情報を取得。
- **`services/barcode_service.py`** … **必須**。バーコード画像の解析など、バーコード関連共通処理。
- **`services/icon_service.py`** … **必須**。タグ用アイコンなどの取得処理。
- **`services/io_intelligence.py`** … **必須**。IO Intelligence API を使った画像説明生成。
- **`services/local_storage.py`** … **必須**。ローカル環境でのストレージ処理（ファイル保存など）。
- **`services/photo_service.py`** … **必須**。写真保存・DB 登録まわりのロジック。
- **`services/supabase_client.py`** … **必須**。Supabase への接続クライアント。
- **`services/tag_extraction.py`** … **必須**。画像説明文などからタグを抽出する処理。
- **`services/tag_service.py`** … **必須**。タグデータの取得・整形。

#### 【削除済】`data/` 配下

- **`data/` フォルダ** … **必須**。データファイル置き場。
- **`data/products.json`** … **必須**。製品情報データ。削除すると登録済みデータが失われる可能性。

#### `supabase/` 配下

- **`supabase/` フォルダ** … **必須（Supabase 利用時）**。設定・マイグレーション一式。

`supabase/docs/`:

- **`supabase/docs/` フォルダ** … **推奨**。Supabase の操作ガイド群。
- **`supabase/docs/supabase_operations_guide.txt`** … **推奨**。操作手順ガイド。
- **`supabase/docs/supabase_policy_guide.txt`** … **推奨**。ポリシー設定の解説。
- **`supabase/docs/supabase_storage_setup_guide.txt`** … **推奨**。Storage 設定手順。
- **`supabase/docs/supabase_template_guide.txt`** … **推奨**。テンプレート／雛形の説明。

`supabase/migrations/`:

- **`supabase/migrations/` フォルダ** … **必須（Supabase 利用時）**。DB スキーマの履歴。
- 各 `.sql` ファイル（`2025...create_photos_table.sql` 〜 `20251031000001_add_product_group_name.sql`） … **必須**。特定時点のマイグレーション。削除すると履歴が分からなくなる。

`supabase/sql/`:

- **`supabase/sql/` フォルダ** … **推奨**。個別 SQL スクリプトの集約。
- **`supabase/sql/fix_storage_policy.sql`** … **推奨**。Storage ポリシー修正用。
- **`supabase/sql/storage_policies.sql`** … **推奨**。ストレージポリシー定義。
- **`supabase/sql/supabase_policy_expanded.sql`** … **推奨**。詳細なポリシー設定。
- **`supabase/sql/supabase_schema.sql`** … **推奨**。スキーマ定義まとめ。
- **`supabase/sql/supabase_setup.sql`** … **推奨**。初期セットアップ用 SQL。
- **`supabase/sql/table_constraints_check.sql`** … **推奨**。制約チェック。
- **`supabase/sql/table_constraints_relax_fixed.sql`** … **推奨**。制約緩和（修正版）。
- **`supabase/sql/table_constraints_relax.sql`** … **推奨**。制約緩和用 SQL。

#### `tests/` 配下

- **`tests/` フォルダ** … **推奨**。自動テスト群。
- **`tests/__init__.py`** … **推奨**。テストパッケージ化。
- **`tests/test_auto_fill.py`** … **推奨**。自動補完機能のテスト。
- **`tests/test_insert.py`** … **推奨**。挿入処理のテスト。
- **`tests/test_save.py`** … **推奨**。保存処理のテスト。
- **`tests/test_schema.py`** … **推奨**。スキーマのテスト。
- **`tests/test_supabase.py`** … **推奨**。Supabase 関連テスト。
- **`tests/test_table.py`** … **推奨**。テーブル関連のテスト。

#### `venv/` 配下（仮想環境）

- **`venv/` フォルダ** … **推奨**。このプロジェクト専用の Python 仮想環境。
  - 中の `Lib/site-packages/` 以下には、Dash や Supabase クライアントなど多数のライブラリファイルがあり、**個々のファイルはすべて「削除可」だが、削除するならフォルダごと一括で**行うのが普通です。
- **`venv/Include/`** … **推奨（venv と一体扱い）**。ヘッダファイル等。単体で触らない。
- **`venv/Lib/`（`site-packages/` ほか）** … **推奨（venv と一体扱い）**。Python ライブラリ本体。
- **`venv/Scripts/`** … **推奨**。`python.exe`, `pip.exe` など実行ファイル。
- **`venv/etc/` / `venv/share/`** … **推奨**。Jupyter 連携などの設定。
- **`venv/pyvenv.cfg`** … **推奨**。仮想環境の設定ファイル。

> **venv 全体について**
>
> - ライブラリを入れ直す前提であれば **`venv/` フォルダごと削除してもよい** ですが、再度 `python -m venv venv` ＋ `pip install -r requirements.txt` が必要になります。
> - 初学者のうちは誤って削除しない方が安全です。

#### その他（隠しファイル・Git 関連）

- **`.git/` フォルダ** … **必須（バージョン管理）**。削除すると履歴がすべて失われる。
- **`.gitignore`**（存在する前提） … **推奨**。Git に無視させるファイルパターン定義。

---

この一覧を見れば、「どのファイルを消してよいか／残すべきか」がツリー構造と一緒に把握できるようになっています。  
**実際の削除は行わず、判断のメモのみここに記録しています。**

`.venv` と `venv` がプロジェクト内でどう扱われているかを確認してから、それぞれの用途と「今後どちらを残すべきか」を整理します。PowerShell スクリプトや設定ファイルがどちらを参照しているかも見ます。

[4 tools called]

### 用途の違い（概念）

- **共通点**

  - どちらも **Python の仮想環境フォルダ** です。
  - 中身は「`python.exe` と `pip`、インストール済みライブラリ（Dash, Supabase など）のセット」で、**プロジェクト専用の Python 実行環境**になっています。

- **名前の違いによる使われ方**
  - `.venv`
    - 先頭にドットが付いているので **隠しフォルダ扱い**。VS Code などのエディタが自動で作ることが多い名前です。
    - このプロジェクトでは `start_with_logs.ps1` が **最優先で `.venv\Scripts\python.exe` を探す** ようになっているため、  
      強制ログ付き起動（`start_with_logs.ps1`）では **`.venv` の Python が使われます**。
  - `venv`
    - 手動で `python -m venv venv` などと叩いたときの、**よくあるデフォルト名**です。
    - 中身は `.venv` とほぼ同じ構成で、同じようなライブラリが入っている **「もう一つの仮想環境」** になっています。

---

### 要・不要の判断

- **`.venv` フォルダ**

  - **用途**:
    - 強制ログ付き起動 (`start_with_logs.ps1`) のときに **第一候補として使われる仮想環境**。
    - `.\.venv\Scripts\python.exe` と、その中のライブラリ群。
  - **要・不要の判断**:
    - **「必要」寄り** です。
      - 現状の設定のまま、`start_with_logs.ps1` をそのまま使いたいなら **残しておく方が安全** です。
    - 将来、「`venv` 側に一本化したい」「.venv を消して整理したい」と思ったら、
      - `start_with_logs.ps1` 内のパスの優先順位を変える（`.venv` → `venv`）などの調整が必要になります。
    - いまの段階では **初心者であれば削除しない方が良い** です。

- **`venv` フォルダ**
  - **用途**:
    - `.venv` と同じく、**このプロジェクト用の仮想環境**。
    - 中身を見るかぎり、Dash や Supabase 関連ライブラリが一式入っている、ほぼ同等の環境です。
  - **要・不要の判断**:
    - 機能的には **「.venv とほぼ重複しているコピー」** なので、
      - 理屈だけ言えば **どちらか一方があれば動かせます**。
    - ただし、どのツール／エディタがどちらを使うように設定されているかは人それぞれなので、
      - 今は **「どちらも残して問題なし（ディスク容量だけ余分）」** という状態です。
    - 片方を消してスッキリさせたい場合は、
      - どちらの環境を実際に使っているか（PowerShell でどちらを `activate` しているか、VS Code がどちらを選んでいるか）を確認してからにするのが安全です。

---

### まとめ

- **用途の違い**: どちらも中身は同種の「仮想環境」ですが、
  - **`.venv`** は強制ログ付き起動スクリプトが優先的に使う環境。
  - **`venv`** はほぼ同内容の「もう一つの仮想環境」で、重複して存在している状態です。
- **要・不要**:
  - プロジェクトを安定して使いたいだけなら、**現状は両方とも「残しておく」判断が安全** です。
  - 将来的に整理するときは、「どちらを本命として使うか」を決めてから、もう一方を削除するイメージになります。
