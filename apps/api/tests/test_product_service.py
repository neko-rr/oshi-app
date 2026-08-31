# TDD: 正規化にタグ系フィールドを含む
from __future__ import annotations

import pytest

from app.services.product_service import list_products_for_member, normalize_product_row


def test_list_products_requires_members_id() -> None:
    with pytest.raises(ValueError, match="members_id"):
        list_products_for_member("", access_token="tok")


def test_normalize_product_row_maps_gallery_fields() -> None:
    row = {
        "registered_product_id": 42,
        "product_name": "アクスタ",
        "photo_id": 7,
        "creation_date": "2026-01-02",
        "photo": {"photo_thumbnail_url": "uid/thumb.jpg"},
        "category_tag_id": 1,
        "storage_location_id": 2,
        "category_tag": {"category_tag_name": "缶", "category_tag_color": "#f00"},
        "storage_location": {
            "storage_location_name": "棚",
            "storage_location_icon": "bi-box",
        },
    }
    out = normalize_product_row(row)
    assert out["photo_thumbnail_path"] == "uid/thumb.jpg"
    assert out["photo_thumbnail_url"] is None
    assert out["category_tag"]["category_tag_name"] == "缶"
    assert out["color_tag_slots"] == []


def test_list_products_uses_fetch_and_filters_by_member_context() -> None:
    def fake_fetch(*, members_id: str, access_token: str, limit: int, offset: int):
        return [
            {
                "registered_product_id": 1,
                "product_name": "A",
                "photo_id": None,
                "creation_date": None,
                "photo": None,
            }
        ]

    mid = "33333333-3333-3333-3333-333333333333"
    items = list_products_for_member(
        mid,
        access_token="user-jwt",
        limit=24,
        offset=0,
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert items[0]["product_name"] == "A"
    assert items[0]["photo_thumbnail_url"] is None


def test_list_products_returns_empty_when_supabase_unconfigured() -> None:
    def boom(**_kwargs):
        raise RuntimeError("supabase_not_configured")

    assert (
        list_products_for_member(
            "33333333-3333-3333-3333-333333333333",
            access_token="tok",
            fetch_page=boom,
        )
        == []
    )
