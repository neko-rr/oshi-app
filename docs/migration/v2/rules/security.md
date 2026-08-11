# セキュリティ方針（v2 ドラフト・新リポへコピー）

Apply Mode: Always Apply

詳細の運用と禁止一覧はリポジトリルートの `.cursor/rules/security.md` を正本とする（本ファイルは monorepo 移行時の複製用）。

## 要点

- **`.env` 実体は Git に入れない**。`.env.example` のみ（キー名・ダミー値）。
- **個人情報・本番ユーザーデータ・秘密鍵をリポジトリに置かない**。
- `git config core.hooksPath .githooks`（ローカル）
- Cursor: `.cursor/hooks.json` + `scripts/secret_guard.py`
- エージェントは秘密をチャットに貼らない。ログはマスク。
