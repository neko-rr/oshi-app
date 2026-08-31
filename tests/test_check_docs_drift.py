# -*- coding: utf-8 -*-
"""check_docs_drift の正規化が時刻行を無視すること。"""
from __future__ import annotations

import importlib.util
from pathlib import Path


def _load():
    path = Path(__file__).resolve().parents[1] / "scripts" / "check_docs_drift.py"
    spec = importlib.util.spec_from_file_location("check_docs_drift", path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_normalize_ignores_timestamps_and_auto_folder_banner() -> None:
    mod = _load()
    a = mod.normalize(
        "<!-- 更新: 自動フォルダの説明 — 中身の生成物は手編集禁止。凡例: docs/README.md -->\n"
        "# title\n"
        "生成時刻 (UTC): `2026-01-01T00:00:00Z`\n"
        "生成日時(UTC): `2026-01-01 00:00:00Z`\n"
        '  "generated_at": "2026-01-01T00:00:00Z",\n'
        "body\n"
    )
    b = mod.normalize("# title\nbody\n")
    assert a == b
