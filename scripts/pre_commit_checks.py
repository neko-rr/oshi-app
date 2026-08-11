#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pre-commit 用エントリ: 秘密検査のあと命名検査。"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(args: list[str]) -> int:
    return subprocess.run(args, cwd=str(ROOT)).returncode


def main() -> int:
    py = sys.executable
    code = run([py, str(ROOT / "scripts" / "secret_guard.py"), "check-staged"])
    if code != 0:
        return code
    # naming は apps/ が出てから本格稼働。現状は違反時 fail
    return run([py, str(ROOT / "scripts" / "naming_check.py"), "check-staged"])


if __name__ == "__main__":
    raise SystemExit(main())
