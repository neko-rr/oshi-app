# セキュリティゲート（秘密情報・個人情報）

Apply Mode: Always Apply

# 目的

Git / チャット / ログ に **API キー・トークン・個人情報・実 .env** が載らないようにする。
バックアップ用 private リポジトリでも **実秘密は入れない**（漏えい時の被害をゼロに近づける）。

## 絶対禁止（コミット・PR・Issue・チャット貼付）

- `.env` および `.env.local` 等の実ファイル（**`.env.example` のみ可**。値は空またはダミー）
- Supabase の **secret / service_role / JWT secret**
- アクセストークン・リフレッシュトークン・Cookie 全文
- 署名付き Storage URL の全文（特にクエリ付き）
- パスワード、秘密鍵（`*.pem` / `id_rsa` 等）
- 実在のメールアドレス一覧、本名、住所、電話、決済情報、本番 DB ダンプ
- Google OAuth の Client Secret

## 必ず Git 管理してよいもの

- `.env.example`（キー名のみ。値は空または明らかにダミー）
- 公開ドキュメント、設計、rules、hooks スクリプト
- マイグレーション SQL（シードに実ユーザー PII を混ぜない）

## エージェント / 開発者の手順

1. 秘密が必要ならローカル `.env` のみ。チャットには **キー名と有無**だけ述べる。
2. `git add -A` の前に `git status` で `.env` が staged でないことを確認。
3. 失敗ログを貼るときは **トークン・Cookie・Authorization ヘッダをマスク**する。
4. Render / Supabase の環境変数はダッシュボードで設定。リポジトリに書かない。
5. 誤ってコミットした場合: **すぐキーをローテーション**し、履歴から除去（単純な後続コミット削除だけでは不十分な場合あり）。

## ハーネス（このリポジトリ）

| 層 | 場所 | 役割 |
|----|------|------|
| ignore | `.gitignore` / `.cursorignore` | 誤 add・インデックス混入を防ぐ |
| Git hook | `.githooks/pre-commit` | コミット直前に禁止パス・パターンを拒否 |
| Cursor hook | `.cursor/hooks.json` | 危険な git 操作や .env 書き込みをブロック |
| 共有検査 | `scripts/secret_guard.py` | 上記から呼ぶ検査ロジック |

Git 初期化後は必ず:

```powershell
git config core.hooksPath .githooks
```

（リポジトリローカル設定のみ。グローバル git config は変更しない）

## 個人情報（アプリデータ）

- ユーザーが登録する写真・メモ・商品データは **Git に入れない**（Supabase 上のみ）。
- テスト用 fixture は **架空データ**のみ。実アカウント UUID をコミットしない。
- `.env.example` の `HEALTH_TEST_USER_ID` / `TEST_MEMBERS_ID` は空のまま。

## 違反を見つけたら

1. push 前ならコミットをやり直す（未 push の場合）。
2. push 済みなら **当該キーを無効化・再発行**が最優先。
3. `cursor_error.md` または `cursor.md` に「何をローテしたか」だけ記録（値は書かない）。
