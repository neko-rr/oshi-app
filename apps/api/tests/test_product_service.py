# TDD: 正規化にタグ系フィールドを含む
from __future__ import annotations

import pytest

from app.services.product_service import (
    filter_products_by_query,
    list_products_for_member,
    normalize_product_row,
)


def test_filter_products_by_query_matches_name_and_tags() -> None:
    items = [
        {
            "product_name": "缶バッジ",
            "category_tag": {"category_tag_name": "ガチャ"},
            "storage_location": {"storage_location_name": "棚A"},
        },
        {
            "product_name": "アクスタ",
            "category_tag": {"category_tag_name": "アクリル"},
            "storage_location": {"storage_location_name": "箱"},
        },
    ]
    assert [i["product_name"] for i in filter_products_by_query(items, "缶")] == [
        "缶バッジ"
    ]
    assert [i["product_name"] for i in filter_products_by_query(items, "棚")] == [
        "缶バッジ"
    ]
    assert len(filter_products_by_query(items, "  ")) == 2


def test_list_products_filters_by_q() -> None:
    def fake_fetch(*, members_id: str, access_token: str, limit: int, offset: int):
        return [
            {
                "registered_product_id": 1,
                "product_name": "缶バッジ",
                "photo_id": None,
                "creation_date": None,
                "photo": None,
            },
            {
                "registered_product_id": 2,
                "product_name": "アクスタ",
                "photo_id": None,
                "creation_date": None,
                "photo": None,
            },
        ]

    mid = "33333333-3333-3333-3333-333333333333"
    items = list_products_for_member(
        mid,
        access_token="user-jwt",
        q="アク",
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert len(items) == 1
    assert items[0]["product_name"] == "アクスタ"


def test_list_products_filters_by_barcode_exact() -> None:
    def fake_fetch(
        *,
        members_id: str,
        access_token: str,
        limit: int,
        offset: int,
        barcode_number: str | None = None,
    ):
        rows = [
            {
                "registered_product_id": 1,
                "product_name": "缶バッジ",
                "barcode_number": "490111",
                "photo_id": None,
                "creation_date": None,
                "photo": None,
            },
            {
                "registered_product_id": 2,
                "product_name": "アクスタ",
                "barcode_number": "490222",
                "photo_id": None,
                "creation_date": None,
                "photo": None,
            },
        ]
        if barcode_number:
            return [r for r in rows if r.get("barcode_number") == barcode_number]
        return rows

    mid = "33333333-3333-3333-3333-333333333333"
    items = list_products_for_member(
        mid,
        access_token="user-jwt",
        barcode="490222",
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert len(items) == 1
    assert items[0]["product_name"] == "アクスタ"
    assert items[0]["barcode_number"] == "490222"


def test_normalize_product_row_includes_barcode() -> None:
    out = normalize_product_row(
        {
            "registered_product_id": 1,
            "product_name": "X",
            "barcode_number": "123",
            "photo": None,
        }
    )
    assert out["barcode_number"] == "123"


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
            "storage_location_icon": "box",
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
