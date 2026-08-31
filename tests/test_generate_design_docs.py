"""generate_design_docs の軽い単体テスト。"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "generate_design_docs.py"


def _load_mod():
    spec = importlib.util.spec_from_file_location("generate_design_docs", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules["generate_design_docs"] = mod
    spec.loader.exec_module(mod)
    return mod


def test_scan_pages_finds_gallery() -> None:
    mod = _load_mod()
    pages = mod.scan_pages()
    paths = {p["path"] for p in pages}
    assert "/gallery" in paths


def test_compute_gaps_lab_not_adopted() -> None:
    mod = _load_mod()
    pages = [{"path": "/gallery", "has_hex_ui": False, "lucide_direct": False, "raw_button": False, "is_dev": False, "file": "x", "hex_line_count": 0, "uses_lib_icons": False}]
    adoption = {"/gallery": {"status": "not_started", "lab_variant": None}}
    gaps = mod.compute_gaps(pages, adoption, [])
    assert any(g["kind"] == "lab_not_fully_adopted" for g in gaps)
