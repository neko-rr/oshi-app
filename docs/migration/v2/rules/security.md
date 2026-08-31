<!-- 更新: ARCHIVE寄り — 移行メモ。現行正本はルート AGENTS.md と .cursor/rules/*.mdc。凡例: docs/README.md -->
# セキュリティ方針（v2 詳細メモ）

> **運用中の命令は `.cursor/rules/security.mdc`。** このファイルは詳細メモ。Always Apply しない。

詳細はリポジトリ `.cursor/rules/security.mdc` を正本とする。

## 要点

- **`.env` 実体は Git に入れない**。`.env.example` のみ（キー名・ダミー値）。
- **個人情報・本番ユーザーデータ・秘密鍵をリポジトリに置かない**。
- `git config core.hooksPath .githooks`（ローカル）
- Cursor: `.cursor/hooks.json` + `scripts/secret_guard.py`
- エージェントは秘密をチャットに貼らない。ログはマスク。
