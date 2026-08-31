# -*- coding: utf-8 -*-
"""check_api_contract_sync のスモーク。"""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load(name: str, rel: str):
    path = ROOT / rel
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_current_repo_shared_matches_api() -> None:
    """現行リポは同期している前提（ずれたら CI/ローカルで気づく）。"""
    chk = _load("check_api_contract_sync", "scripts/check_api_contract_sync.py")
    mod = chk._load_product_docs()
    assert chk.shared_api_mismatches(mod) == []


def test_mismatch_detected_for_fake_shared_path() -> None:
    chk = _load("check_api_contract_sync", "scripts/check_api_contract_sync.py")
    mod = chk._load_product_docs()
    api = mod.scan_api_routes()
    api_paths = {mod.normalize_api_path(r["path"]) for r in api}
    gaps = mod.compute_gaps(
        [],
        set(),
        api_paths,
        {"/this-path-should-not-exist-in-api-zz"},
    )
    kinds = {g["kind"] for g in gaps}
    assert "shared_not_in_api" in kinds
