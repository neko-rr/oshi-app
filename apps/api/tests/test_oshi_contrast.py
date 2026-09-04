# TDD: 推し色コントラスト（WCAG AA 4.5:1 目安）と HEX 正規化
from __future__ import annotations

import pytest

from app.services.oshi_contrast import (
    best_foreground,
    contrast_ratio,
    normalize_hex,
    resolve_oshi_colors,
    soft_surface,
)


def test_normalize_hex_ok() -> None:
    assert normalize_hex("#9F606C") == "#9f606c"
    assert normalize_hex("6a9bb8") == "#6a9bb8"


def test_normalize_hex_rejects_invalid() -> None:
    with pytest.raises(ValueError):
        normalize_hex("red")
    with pytest.raises(ValueError):
        normalize_hex("#fff")


def test_best_foreground_on_dark_main_is_white() -> None:
    fg = best_foreground("#1a1614")
    assert fg == "#ffffff"
    assert (contrast_ratio(fg, "#1a1614") or 0) >= 4.5


def test_best_foreground_on_light_bg_is_dark() -> None:
    fg = best_foreground("#f5f5f5")
    assert fg == "#1a1614"
    assert (contrast_ratio(fg, "#f5f5f5") or 0) >= 4.5


def test_resolve_oshi_colors_includes_soft_pair() -> None:
    resolved = resolve_oshi_colors("#9f606c", "#6a9bb8")
    assert resolved["main_hex"] == "#9f606c"
    assert resolved["sub_hex"] == "#6a9bb8"
    assert resolved["main_foreground"] in {"#ffffff", "#1a1614"} or resolved[
        "main_foreground"
    ].startswith("#")
    assert (contrast_ratio(resolved["main_foreground"], resolved["main_hex"]) or 0) >= 4.5
    soft = soft_surface("#6a9bb8")
    assert resolved["soft_bg"] == soft
    assert (contrast_ratio(resolved["soft_foreground"], resolved["soft_bg"]) or 0) >= 4.5
