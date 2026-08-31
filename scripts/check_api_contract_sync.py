#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""API_PATHS（shared）↔ FastAPI ルートの同期検査。

使い方:
  python scripts/check_api_contract_sync.py

generate_product_docs の scan / 照合を再利用し、shared_not_in_api だけを fail にする。
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load_product_docs():
    path = ROOT / "scripts" / "generate_product_docs.py"
    spec = importlib.util.spec_from_file_location("generate_product_docs", path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def shared_api_mismatches(mod) -> list[str]:
    """shared にあって API に無いパスの説明一覧。"""
    api = mod.scan_api_routes()
    shared = mod.scan_shared_paths()
    api_paths = {mod.normalize_api_path(r["path"]) for r in api}
    shared_paths = {p["path"] for p in shared}
    gaps = mod.compute_gaps([], set(), api_paths, shared_paths)
    return [
        g["detail"]
        for g in gaps
        if g.get("kind") == "shared_not_in_api"
    ]


def main() -> int:
    mod = _load_product_docs()
    bad = shared_api_mismatches(mod)
    if not bad:
        shared_n = len(mod.scan_shared_paths())
        api_n = len(mod.scan_api_routes())
        print(f"api-contract-sync: OK（shared={shared_n} api_routes={api_n}）")
        return 0
    print("=== api-contract-sync: shared ↔ API 不一致 ===", file=sys.stderr)
    for detail in bad:
        print(f"  - {detail}", file=sys.stderr)
    print(
        "直し方: packages/shared の API_PATHS か apps/api/app/routers を揃える。"
        " skill api-contract-sync 参照。",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
