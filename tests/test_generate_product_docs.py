"""generate_product_docs のパス照合・ギャップ判定の単体テスト。"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "generate_product_docs.py"


def _load_mod():
    spec = importlib.util.spec_from_file_location("generate_product_docs", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules["generate_product_docs"] = mod
    spec.loader.exec_module(mod)
    return mod


def test_path_covered_bracket_and_brace() -> None:
    mod = _load_mod()
    web = {"/gallery/12", "/gallery"}
    assert mod.path_covered("/gallery/[registered_product_id]", web)
    assert mod.path_covered("/gallery", web)
    assert not mod.path_covered("/search", web)
    api = {"/products/3", "/products"}
    assert mod.path_covered("/products/{registered_product_id}", api)


def test_deferred_unexpected_web_gap() -> None:
    mod = _load_mod()
    features = [
        {
            "id": "oshi_room",
            "status": "deferred",
            "evidence_paths": [],
            "expected_web_paths": ["/oshi-room"],
            "expected_api_paths": [],
        }
    ]
    gaps = mod.compute_gaps(features, {"/oshi-room"}, set(), set())
    kinds = {g["kind"] for g in gaps}
    assert "unexpected_web_route" in kinds


def test_partial_missing_expected_api() -> None:
    mod = _load_mod()
    features = [
        {
            "id": "gallery",
            "status": "partial",
            "evidence_paths": ["docs/product/README.md"],
            "expected_web_paths": ["/gallery"],
            "expected_api_paths": ["/products"],
        }
    ]
    gaps = mod.compute_gaps(features, {"/gallery"}, set(), set())
    assert any(g["kind"] == "missing_expected_api" for g in gaps)
