# TDD: カラータグ割合（slot ごとの付与件数 / 付与合計）。
from __future__ import annotations

from app.services.color_tag_analytics_service import build_color_tag_share


def test_build_color_tag_share_percentages() -> None:
    tags = [
        {"slot": 1, "color_tag_name": "赤", "color_tag_color": "#dc3545"},
        {"slot": 2, "color_tag_name": "青", "color_tag_color": "#0d6efd"},
        {"slot": 3, "color_tag_name": "緑", "color_tag_color": "#198754"},
    ]
    out = build_color_tag_share(
        tags=tags,
        assignment_slots=[1, 1, 2],
        tagged_product_ids={10, 11},
        product_total=5,
    )
    by_slot = {row["slot"]: row for row in out["items"]}
    assert by_slot[1]["count"] == 2
    assert by_slot[1]["share"] == 0.6667
    assert by_slot[2]["count"] == 1
    assert by_slot[2]["share"] == 0.3333
    assert by_slot[3]["count"] == 0
    assert by_slot[3]["share"] == 0.0
    assert out["assignment_total"] == 3
    assert out["product_total"] == 5
    assert out["untagged_count"] == 3


def test_build_color_tag_share_empty() -> None:
    out = build_color_tag_share(
        tags=[{"slot": 1, "color_tag_name": "赤", "color_tag_color": "#dc3545"}],
        assignment_slots=[],
        tagged_product_ids=set(),
        product_total=0,
    )
    assert out["items"][0]["count"] == 0
    assert out["items"][0]["share"] == 0.0
    assert out["assignment_total"] == 0
    assert out["untagged_count"] == 0


def test_build_color_tag_share_ignores_unknown_slots() -> None:
    out = build_color_tag_share(
        tags=[{"slot": 1, "color_tag_name": "赤", "color_tag_color": "#ffffff"}],
        assignment_slots=[1, 9, 0],
        tagged_product_ids={1},
        product_total=1,
    )
    assert out["assignment_total"] == 1
    assert out["items"][0]["count"] == 1
