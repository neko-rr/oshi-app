# -*- coding: utf-8 -*-
"""agent_hooks / secret_guard hook の軽い単体テスト。"""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load(name: str, rel: str):
    path = ROOT / rel
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_secret_guard_blocks_git_no_verify() -> None:
    sg = _load("secret_guard", "scripts/secret_guard.py")
    assert sg.shell_command_is_dangerous("git commit -m 'x' --no-verify")
    assert sg.shell_command_is_dangerous("git commit -n -m 'x'")
    assert sg.shell_command_is_dangerous("git push --no-verify")
    assert sg.shell_command_is_dangerous("git commit -m 'ok'") is None


def test_secret_guard_hook_json_denies_no_verify() -> None:
    payload = json.dumps({"command": "git commit -m x --no-verify"})
    p = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "secret_guard.py"), "hook"],
        input=payload,
        text=True,
        capture_output=True,
        cwd=ROOT,
        check=False,
    )
    assert p.returncode == 0
    body = json.loads(p.stdout)
    assert body.get("permission") == "deny"


def test_agent_hooks_classify_and_verify_gate(tmp_path, monkeypatch) -> None:
    ah = _load("agent_hooks", "scripts/agent_hooks.py")
    monkeypatch.setattr(ah, "STATE_DIR", tmp_path)
    monkeypatch.setattr(ah, "STATE_PATH", tmp_path / "agent_session.json")

    assert ah.classify_path("apps/api/app/main.py") == "api"
    assert ah.classify_path("apps/web/src/app/page.tsx") == "web"
    assert ah.classify_path("docs/README.md") is None

    state = ah._default_state()
    ah.mark_path(state, "apps/api/app/main.py")
    assert ah.needs_verify(state) is True
    state["ran_verify"] = True
    assert ah.needs_verify(state) is False


def test_agent_hooks_stop_followup_once(tmp_path, monkeypatch, capsys) -> None:
    ah = _load("agent_hooks", "scripts/agent_hooks.py")
    monkeypatch.setattr(ah, "STATE_DIR", tmp_path)
    monkeypatch.setattr(ah, "STATE_PATH", tmp_path / "agent_session.json")
    state = ah._default_state()
    state["touched_api"] = True
    ah.save_state(state)

    rc = ah.handle_stop({"status": "completed", "loop_count": 0})
    assert rc == 0
    out = json.loads(capsys.readouterr().out)
    assert "followup_message" in out

    rc2 = ah.handle_stop({"status": "completed", "loop_count": 1})
    assert rc2 == 0
    out2 = json.loads(capsys.readouterr().out)
    assert out2 == {}


def test_agent_hooks_session_start_resets(tmp_path, monkeypatch, capsys) -> None:
    ah = _load("agent_hooks", "scripts/agent_hooks.py")
    monkeypatch.setattr(ah, "STATE_DIR", tmp_path)
    monkeypatch.setattr(ah, "STATE_PATH", tmp_path / "agent_session.json")
    dirty = ah._default_state()
    dirty["touched_api"] = True
    ah.save_state(dirty)

    rc = ah.handle_session_start({})
    assert rc == 0
    payload = json.loads(capsys.readouterr().out)
    assert "additional_context" in payload
    assert ah.load_state()["touched_api"] is False
