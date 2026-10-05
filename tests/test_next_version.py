# TDD: Web は Next.js 16（公式アップグレード先。vinext も 16 前提）。
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PKG = ROOT / "apps" / "web" / "package.json"


def test_web_uses_next_16() -> None:
    data = json.loads(PKG.read_text(encoding="utf-8"))
    next_ver = str(data["dependencies"]["next"]).lstrip("^~")
    eslint_ver = str(data["devDependencies"]["eslint-config-next"]).lstrip("^~")
    assert next_ver.startswith("16."), next_ver
    assert eslint_ver.startswith("16."), eslint_ver
    assert "next lint" not in data["scripts"]["lint"]
    assert "@opennextjs/cloudflare" in data["dependencies"]
    assert "wrangler" in data["devDependencies"]
