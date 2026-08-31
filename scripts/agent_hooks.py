#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cursor Agent 品質フック（軽いリマインド専用）。

イベント:
  sessionStart   — AGENTS 要約を additional_context 注入。状態リセット
  afterFileEdit  — 編集パスを記録（stdout は空 JSON）
  postToolUse    — API 初回編集時に soft リマインド / verify 検知
  stop           — コード変更あり・verify 未実行なら followup 1回まで

強制実行はしない。秘密ガードは secret_guard.py 側。
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
STATE_DIR = ROOT / ".cursor" / "hooks.local"
STATE_PATH = STATE_DIR / "agent_session.json"

# セッション冒頭用（短く固定。毎回 AGENTS.md 全文を読まない）
SESSION_CONTEXT = """[oshi-app / session]
絶対: 秘密を出さない。Auth は Supabase。API は JWKS のみ。members_id = JWT sub。業務は apps/api/services。
品質: 振る舞い変更は TDD。変更後は skill post-change-verify（API pytest / Web lint+tsc）。
着手前: Auth・DB・デプロイは skill official-docs-first。
ARCHIVE を新規設計の正にしない（.cursor/plans/archive, .cursor/rules/reference）。
入口: AGENTS.md / CONTRIBUTING.md / .cursor/rules/README.md
"""

VERIFY_CMD_RE = re.compile(
    r"(?i)(\bpytest\b|pnpm\s+test:api|pnpm\s+typecheck:web|pnpm\s+lint:web|"
    r"compileall|post-change-verify|check_docs_drift|check_design_compliance|"
    r"check_design_tokens|sync_design_icons)"
)

API_EDIT_REMINDER = (
    "[hook] apps/api を編集しました。このターンか完了前に "
    "`pnpm test:api` または skill post-change-verify を検討してください（任意・強制ではありません）。"
)

STOP_FOLLOWUP = (
    "【hook リマインド】コード変更があり、このセッションで verify 相当の実行が見つかりませんでした。"
    "必要なら skill post-change-verify（API: pytest / Web: lint+tsc）を実行してください。"
    "不要なら「スキップ」とだけ返答して構いません。"
)


def _default_state() -> dict[str, Any]:
    return {
        "touched_api": False,
        "touched_web": False,
        "touched_packages": False,
        "ran_verify": False,
        "api_edit_reminded": False,
    }


def load_state() -> dict[str, Any]:
    try:
        if STATE_PATH.is_file():
            data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                base = _default_state()
                base.update({k: data.get(k, base[k]) for k in base})
                return base
    except (OSError, json.JSONDecodeError):
        pass
    return _default_state()


def save_state(state: dict[str, Any]) -> None:
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        STATE_PATH.write_text(
            json.dumps(state, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    except OSError:
        # 状態保存失敗でもエージェント作業は止めない
        pass


def _emit(obj: dict[str, Any]) -> int:
    print(json.dumps(obj, ensure_ascii=False))
    return 0


def _read_stdin() -> dict[str, Any]:
    try:
        raw = sys.stdin.read()
        data = json.loads(raw) if raw.strip() else {}
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def norm_repo_path(path: str) -> str:
    """絶対/相対をリポジトリ相対の / 区切りに。"""
    if not path or not isinstance(path, str):
        return ""
    p = path.replace("\\", "/")
    root = str(ROOT).replace("\\", "/")
    if p.lower().startswith(root.lower()):
        p = p[len(root) :].lstrip("/")
    return p.lstrip("./")


def classify_path(rel: str) -> str | None:
    """編集対象カテゴリ。None = 検証リマインド対象外。"""
    n = rel.replace("\\", "/")
    if n.startswith("apps/api/"):
        return "api"
    if n.startswith("apps/web/") or n.startswith("packages/"):
        return "web" if n.startswith("apps/web/") else "packages"
    return None


def mark_path(state: dict[str, Any], rel: str) -> None:
    kind = classify_path(rel)
    if kind == "api":
        state["touched_api"] = True
    elif kind == "web":
        state["touched_web"] = True
    elif kind == "packages":
        state["touched_packages"] = True


def needs_verify(state: dict[str, Any]) -> bool:
    return bool(
        (state["touched_api"] or state["touched_web"] or state["touched_packages"])
        and not state["ran_verify"]
    )


def extract_path_from_tool_input(tool_input: Any) -> str:
    if not isinstance(tool_input, dict):
        return ""
    for key in ("path", "file_path", "target_notebook"):
        v = tool_input.get(key)
        if isinstance(v, str) and v.strip():
            return v
    return ""


def extract_command(data: dict[str, Any], tool_input: Any) -> str:
    cmd = data.get("command")
    if isinstance(cmd, str) and cmd.strip():
        return cmd
    if isinstance(tool_input, dict):
        c = tool_input.get("command")
        if isinstance(c, str):
            return c
    return ""


def handle_session_start(_data: dict[str, Any]) -> int:
    save_state(_default_state())
    return _emit({"additional_context": SESSION_CONTEXT})


def handle_after_file_edit(data: dict[str, Any]) -> int:
    rel = norm_repo_path(str(data.get("file_path") or ""))
    if rel:
        state = load_state()
        mark_path(state, rel)
        save_state(state)
    # afterFileEdit は公式に注入フィールドなし
    return _emit({})


def handle_post_tool_use(data: dict[str, Any]) -> int:
    tool_name = str(data.get("tool_name") or data.get("tool") or "")
    tool_input = data.get("tool_input") or data.get("input") or data.get("arguments") or {}
    state = load_state()
    out: dict[str, Any] = {}

    # Shell: verify 実行を検知
    cmd = extract_command(data, tool_input)
    if cmd and VERIFY_CMD_RE.search(cmd):
        state["ran_verify"] = True
        save_state(state)
        return _emit({})

    # Write / StrReplace: パス記録 + API 初回だけ soft リマインド
    path = extract_path_from_tool_input(tool_input)
    rel = norm_repo_path(path)
    if rel:
        mark_path(state, rel)
        if (
            classify_path(rel) == "api"
            and not state["api_edit_reminded"]
            and not state["ran_verify"]
        ):
            state["api_edit_reminded"] = True
            out["additional_context"] = API_EDIT_REMINDER
        save_state(state)

    # tool_name が空でも path があれば上で処理済み
    _ = tool_name
    return _emit(out)


def handle_stop(data: dict[str, Any]) -> int:
    status = str(data.get("status") or "")
    loop_count = data.get("loop_count")
    try:
        loop_n = int(loop_count) if loop_count is not None else 0
    except (TypeError, ValueError):
        loop_n = 0

    if status != "completed" or loop_n > 0:
        return _emit({})

    state = load_state()
    if needs_verify(state):
        # followup は 1 回まで（hooks.json の loop_limit: 1 と併用）
        return _emit({"followup_message": STOP_FOLLOWUP})
    return _emit({})


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(
            "Usage: agent_hooks.py sessionStart|afterFileEdit|postToolUse|stop",
            file=sys.stderr,
        )
        return 2
    event = argv[1]
    data = _read_stdin()
    try:
        if event == "sessionStart":
            return handle_session_start(data)
        if event == "afterFileEdit":
            return handle_after_file_edit(data)
        if event == "postToolUse":
            return handle_post_tool_use(data)
        if event == "stop":
            return handle_stop(data)
        print(f"unknown event: {event}", file=sys.stderr)
        return _emit({})
    except Exception as exc:
        print(f"agent_hooks error: {exc}", file=sys.stderr)
        return _emit({})


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
