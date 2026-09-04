# -*- coding: utf-8 -*-
"""check_i18n_message_keys の単体テスト（TDD）。"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load():
    path = ROOT / "scripts" / "check_i18n_message_keys.py"
    spec = importlib.util.spec_from_file_location("check_i18n_message_keys", path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_flatten_nested_keys() -> None:
    chk = _load()
    keys = chk.flatten_message_keys(
        {"Nav": {"home": "ホーム"}, "Register": {"assist": {"error": "失敗"}}}
    )
    assert keys == {"Nav.home", "Register.assist.error"}


def test_diff_detects_missing_in_en() -> None:
    chk = _load()
    ja = {"Common": {"save": "保存", "edit": "編集"}}
    en = {"Common": {"save": "Save"}}
    missing_en, missing_ja = chk.diff_message_keys(ja, en)
    assert missing_en == ["Common.edit"]
    assert missing_ja == []


def test_diff_detects_missing_in_ja() -> None:
    chk = _load()
    ja = {"Common": {"save": "保存"}}
    en = {"Common": {"save": "Save", "extra": "Extra"}}
    missing_en, missing_ja = chk.diff_message_keys(ja, en)
    assert missing_en == []
    assert missing_ja == ["Common.extra"]


def test_compare_files_reports_mismatch(tmp_path: Path) -> None:
    chk = _load()
    ja_path = tmp_path / "ja.json"
    en_path = tmp_path / "en.json"
    ja_path.write_text(
        json.dumps({"A": {"x": "あ"}, "B": {"y": "い"}}, ensure_ascii=False),
        encoding="utf-8",
    )
    en_path.write_text(
        json.dumps({"A": {"x": "a"}}, ensure_ascii=False),
        encoding="utf-8",
    )
    result = chk.compare_message_files(ja_path, en_path)
    assert result.ok is False
    assert "B.y" in result.missing_in_en
    assert result.missing_in_ja == []


def test_repo_ja_en_keys_match() -> None:
    """本番辞書はキー集合が一致している前提。"""
    chk = _load()
    ja = ROOT / "apps" / "web" / "messages" / "ja.json"
    en = ROOT / "apps" / "web" / "messages" / "en.json"
    result = chk.compare_message_files(ja, en)
    assert result.ok, (
        f"missing_in_en={result.missing_in_en[:20]!r} "
        f"missing_in_ja={result.missing_in_ja[:20]!r}"
    )
