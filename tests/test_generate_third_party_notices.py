# -*- coding: utf-8 -*-
"""generate_third_party_notices の単体テスト。"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "generate_third_party_notices.py"


def _load():
    spec = importlib.util.spec_from_file_location("generate_third_party_notices", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules["generate_third_party_notices"] = mod
    spec.loader.exec_module(mod)
    return mod


def test_build_payload_sorts_and_includes_services() -> None:
    mod = _load()
    packages = [
        {
            "name": "zzz",
            "version": "1.0.0",
            "license": "MIT",
            "ecosystem": "npm",
            "homepage": "",
        },
        {
            "name": "aaa",
            "version": "2.0.0",
            "license": "Apache-2.0",
            "ecosystem": "npm",
            "homepage": "https://example.com",
        },
    ]
    services = [
        {
            "id": "rakuten",
            "name_ja": "楽天",
            "attribution_required": True,
            "status": "deferred_live_off",
            "note_ja": "LIVE オフ",
            "docs_url": None,
        }
    ]
    payload = mod.build_payload(packages, services, generated_at="2026-09-01T00:00:00Z")
    assert payload["generated_at"] == "2026-09-01T00:00:00Z"
    assert [p["name"] for p in payload["packages"]] == ["aaa", "zzz"]
    assert payload["services"][0]["id"] == "rakuten"
    assert "oshi-app" in payload["app_notice_ja"]


def test_render_markdown_contains_table_and_services() -> None:
    mod = _load()
    payload = mod.build_payload(
        [
            {
                "name": "next",
                "version": "15.0.0",
                "license": "MIT",
                "ecosystem": "npm",
                "homepage": "",
            }
        ],
        [
            {
                "id": "supabase",
                "name_ja": "Supabase",
                "attribution_required": False,
                "status": "active",
                "note_ja": "認証・DB",
                "docs_url": "https://supabase.com",
            }
        ],
        generated_at="2026-09-01T00:00:00Z",
    )
    md = mod.render_markdown(payload)
    assert "手編集禁止" in md
    assert "| next |" in md
    assert "Supabase" in md
    assert "MIT" in md


def test_normalize_for_check_ignores_generated_at() -> None:
    mod = _load()
    a = {"generated_at": "2026-01-01T00:00:00Z", "packages": [{"name": "x"}]}
    b = {"generated_at": "2026-02-02T00:00:00Z", "packages": [{"name": "x"}]}
    assert mod.normalize_payload_for_check(a) == mod.normalize_payload_for_check(b)


def test_write_outputs_syncs_web_and_docs(tmp_path: Path) -> None:
    mod = _load()
    docs_gen = tmp_path / "docs" / "legal" / "generated"
    web_gen = tmp_path / "apps" / "web" / "src" / "data" / "generated"
    payload = mod.build_payload([], [], generated_at="2026-09-01T00:00:00Z")
    mod.write_outputs(payload, docs_gen=docs_gen, web_gen=web_gen)
    docs_json = json.loads((docs_gen / "third_party_notices.json").read_text(encoding="utf-8"))
    web_json = json.loads((web_gen / "third_party_notices.json").read_text(encoding="utf-8"))
    assert docs_json == web_json
    assert (docs_gen / "third_party_notices.md").is_file()
