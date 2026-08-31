"""check_design_tokens の単体テスト。"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_design_tokens.py"


def _load_mod():
    spec = importlib.util.spec_from_file_location("check_design_tokens", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules["check_design_tokens"] = mod
    spec.loader.exec_module(mod)
    return mod


def test_extract_root_vars_first_block_only() -> None:
    mod = _load_mod()
    css = """
:root {
    --background: oklch(1 0 0);
    --primary: oklch(0.5 0.1 100);
}
:root[data-theme="x"] {
    --only-theme: 1;
}
"""
    names = mod.extract_root_vars(css)
    assert "background" in names
    assert "primary" in names
    assert "only-theme" not in names


def test_extract_tailwind_bridges() -> None:
    mod = _load_mod()
    tw = """
@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
}
"""
    bridges = mod.extract_tailwind_bridges(tw)
    assert bridges["primary"] == "primary"
    assert bridges["background"] == "background"


def test_repo_tokens_check_ok() -> None:
    mod = _load_mod()
    errors = mod.check_tokens()
    assert errors == [], errors
