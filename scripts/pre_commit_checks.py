#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pre-commit 用エントリ: 秘密・命名・icons 同期・design compliance。"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(args: list[str]) -> int:
    return subprocess.run(args, cwd=str(ROOT)).returncode


def main() -> int:
    py = sys.executable
    steps = [
        [py, str(ROOT / "scripts" / "secret_guard.py"), "check-staged"],
        [py, str(ROOT / "scripts" / "naming_check.py"), "check-staged"],
        [py, str(ROOT / "scripts" / "sync_design_icons.py"), "--check-staged"],
        [py, str(ROOT / "scripts" / "check_design_tokens.py"), "--check-staged"],
        [py, str(ROOT / "scripts" / "check_design_compliance.py"), "--check-staged"],
    ]
    for args in steps:
        code = run(args)
        if code != 0:
            return code
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
