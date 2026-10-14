"""グッズの色。カラータグとは別の複数選択。"""

import pytest

from app.services.product_color import (
    build_product_color_share,
    match_product_color_codes,
    normalize_product_color_codes,
)


def test_match_maps_vision_names_to_multiple_codes() -> None:
    assert match_product_color_codes(["ピンク", "赤", "gold"]) == [
        "red",
        "pink",
        "gold",
    ]


def test_match_ignores_multicolor_label() -> None:
    assert match_product_color_codes(["多色", "カラフル", "mixed"]) == []


def test_match_keeps_hair_and_eye_as_separate_codes() -> None:
    assert match_product_color_codes(["髪は黒", "瞳は水色"]) == [
        "black",
        "light_blue",
    ]


def test_normalize_rejects_unknown_and_orders_catalog() -> None:
    assert normalize_product_color_codes(["silver", "red", "red"]) == [
        "red",
        "silver",
    ]
    with pytest.raises(ValueError):
        normalize_product_color_codes(["multi"])


def test_share_counts_each_color_and_skips_empty() -> None:
    share = build_product_color_share(
        code_lists=[["pink", "black"], ["pink"], []],
        product_total=3,
    )
    by_code = {row["product_color_code"]: row for row in share["items"]}
    assert by_code["pink"]["count"] == 2
    assert by_code["black"]["count"] == 1
    assert "white" not in by_code
    assert share["uncolored_count"] == 1
    assert share["assignment_total"] == 3
    assert by_code["pink"]["product_color_hex"].startswith("#")
