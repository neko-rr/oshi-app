"""check_design_compliance の単体テスト。"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_design_compliance.py"


def _load_mod():
    spec = importlib.util.spec_from_file_location("check_design_compliance", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules["check_design_compliance"] = mod
    spec.loader.exec_module(mod)
    return mod


def test_hex_in_page_is_finding(tmp_path: Path) -> None:
    mod = _load_mod()
    # scan_file は WEB_SRC 相対を使うため、一時ファイルを WEB_SRC 配下に置けない。
    # 代わりに allow 判定と正規表現を直接検証する。
    assert mod.HEX_RE.search("color: #9f606c;")
    assert not mod.is_allowed("app/gallery/page.tsx", mod.ALLOW_HEX_GLOBS)
    assert mod.is_allowed("styles/colors.css", mod.ALLOW_HEX_GLOBS)
    assert mod.is_allowed("components/design-lab/x.tsx", mod.ALLOW_HEX_GLOBS)


def test_lucide_allowlist() -> None:
    mod = _load_mod()
    assert "lib/icons.ts" in mod.ALLOW_LUCIDE_DIRECT
    assert mod.LUCIDE_IMPORT_RE.search('from "lucide-react"')
    assert mod.LUCIDE_IMPORT_RE.search("from 'lucide-react'")


def test_raw_button_allowlist() -> None:
    mod = _load_mod()
    assert mod.is_allowed("components/ui/button.tsx", mod.ALLOW_RAW_BUTTON_GLOBS)
    assert not mod.is_allowed("app/gallery/page.tsx", mod.ALLOW_RAW_BUTTON_GLOBS)
    assert mod.RAW_BUTTON_RE.search('<button type="button">')


def test_repo_scan_passes_or_only_allowed() -> None:
    """現行リポは許可外パスで fail しない（Lab / styles / カラータグ設定は許可）。"""
    mod = _load_mod()
    findings = []
    for path in mod.iter_source_files(None):
        findings.extend(mod.scan_file(path))
    assert findings == [], findings


def test_color_tag_paths_allow_hex() -> None:
    mod = _load_mod()
    assert mod.is_allowed("app/settings/color-tags/page.tsx", mod.ALLOW_HEX_GLOBS)
    assert mod.is_allowed("app/settings/category-tags/page.tsx", mod.ALLOW_HEX_GLOBS)
