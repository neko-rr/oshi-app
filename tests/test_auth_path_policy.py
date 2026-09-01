# -*- coding: utf-8 -*-
"""Web auth-path-policy の自己検査を CI / ローカルで叩く。"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SELFTEST = (
    ROOT / "apps" / "web" / "src" / "lib" / "auth-path-policy.selftest.ts"
)


def test_auth_path_policy_selftest() -> None:
    node = shutil.which("node")
    assert node, "node が PATH に必要"
    proc = subprocess.run(
        [node, "--experimental-strip-types", str(SELFTEST)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    assert proc.returncode == 0, proc.stdout + proc.stderr
    assert "OK" in proc.stdout
