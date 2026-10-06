# TDD: pnpm が CF ビルドに必要な native の install スクリプトを許可する。
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_pnpm_allows_workerd_and_esbuild_build_scripts() -> None:
    pkg = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    allowed = pkg.get("pnpm", {}).get("onlyBuiltDependencies") or []
    names = {str(n).lower() for n in allowed}
    assert "esbuild" in names
    assert "workerd" in names
