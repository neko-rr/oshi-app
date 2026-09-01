# Lucide アイコン slug 正規化（TDD）
from __future__ import annotations

from app.services.lucide_icon_catalog import (
    normalize_category_icon,
    normalize_lucide_icon_slug,
    normalize_storage_icon,
)


def test_normalize_maps_bootstrap_category() -> None:
    assert normalize_category_icon("bi-circle") == "circle"
    assert normalize_category_icon("bi-tag") == "tag"


def test_normalize_maps_bootstrap_storage() -> None:
    assert normalize_storage_icon("bi-archive") == "archive"
    assert normalize_storage_icon("bi-geo") == "map-pin"


def test_normalize_keeps_valid_lucide_slug() -> None:
    assert normalize_category_icon("layers") == "layers"
    assert normalize_storage_icon("lamp-desk") == "lamp-desk"


def test_normalize_unknown_falls_back() -> None:
    assert normalize_category_icon("not-a-real-icon") == "tag"
    assert normalize_storage_icon("???") == "map-pin"


def test_normalize_empty_uses_fallback() -> None:
    assert normalize_lucide_icon_slug(None, fallback="tag") == "tag"
    assert normalize_lucide_icon_slug("  ", fallback="map-pin") == "map-pin"
