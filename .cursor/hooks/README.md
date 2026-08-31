# Cursor hooks（プロジェクト）

定義: [hooks.json](../hooks.json)

| イベント | スクリプト | 役割 |
|----------|------------|------|
| `beforeShellExecution` / `preToolUse` | `scripts/secret_guard.py hook` | 秘密・`--no-verify` 拒否 |
| `sessionStart` | `scripts/agent_hooks.py sessionStart` | AGENTS 要約注入・状態リセット |
| `afterFileEdit` | `scripts/agent_hooks.py afterFileEdit` | 編集パス記録（軽い） |
| `postToolUse` | `scripts/agent_hooks.py postToolUse` | API 初回編集の soft リマインド / verify 検知 |
| `stop` | `scripts/agent_hooks.py stop` | verify 未実行なら followup **最大1回** |

状態ファイル: `.cursor/hooks.local/agent_session.json`（gitignore。強制実行はしない）。

手動確認:

```powershell
echo '{}' | python scripts/agent_hooks.py sessionStart
echo '{"file_path":"apps/api/app/main.py"}' | python scripts/agent_hooks.py afterFileEdit
echo '{"status":"completed","loop_count":0}' | python scripts/agent_hooks.py stop
```
