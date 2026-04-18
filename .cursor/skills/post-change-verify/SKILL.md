---
name: post-change-verify
description: >-
  コード変更後に Python の構文チェックと pytest をリポジトリルートで実行する。
  services / features / pages 等のアプリコードを触った直後に適用する。
---

# 変更後検証（post-change-verify）

## いつ使うか

- `services/`、`features/`、`pages/`、`components/`、`app.py`、`server.py` を変更したあと。
- 依存追加や import 変更があったあと。

## 実行場所（必須）

- **作業ディレクトリ**: リポジトリのルート（`requirements.txt` と `tests/` がある階層）。
- Windows PowerShell の例: `cd` で各自のクローン先のルートへ移動（例: `cd C:\Users\<user>\Desktop\oshi-app`）。

## 実行順（この順で行う）

1. **仮想環境**（未作成なら `python -m venv .venv`）:
   - `.\.venv\Scripts\Activate.ps1`
2. **依存の同期**（pytest を含む）:
   - `pip install -r requirements.txt`
3. **構文チェック**（インポート時の構文エラー検出）:
   - `python -m compileall -q services features pages components app.py server.py`
4. **テスト**:
   - `python -m pytest tests/ -q`

失敗したら、エラーメッセージとファイル名・行番号を起点に修正する。エージェントに依頼する場合は上記ログを貼る。

## スキップしてよい場合

- ドキュメントのみ（`*.md`、`.cursor/plans/` のみ等）で Python を一切触らない変更。
- 画像・アセットのみの差し替えでコード変更がない場合。

## 秘密情報・ログ

- 失敗調査時も **環境変数の値・JWT・Cookie・Supabase キー・署名 URL 全文**をログやチャットに貼らない。
- テストやデバッグ出力にストアの base64 等を出さない（既存方針と [Cursor.md](../../Cursor.md) のセキュリティゲートに従う）。

## 注意（テスト結果の解釈）

- `pytest` が緑でも、既存の一部テストは assert が弱く **常に成功に見える**箇所がある。回帰の最終判断は仕様に沿った手動確認とセットとする。
- `tests/test_insert.py` と `tests/test_table.py` は **モジュール単位でスキップ**されており、統合環境での手動実行用の枠である。
