# -*- coding: utf-8 -*-
"""TDD: product_external_ref の検証と upsert。"""

from __future__ import annotations

import pytest

from app.services import product_external_ref_service as svc


def test_validate_rakuten_requires_code_url_shop() -> None:
    with pytest.raises(ValueError, match="楽天"):
        svc.validate_external_ref(
            {
                "source": "rakuten",
                "product_url": "https://example.com/a",
                "external_item_code": "",
                "shop_name": "店",
            }
        )


def test_validate_manual_requires_url_only() -> None:
    cleaned = svc.validate_external_ref(
        {
            "source": "manual",
            "product_url": " https://mercari.example/item ",
            "label": "メルカリ",
            "is_primary": True,
        }
    )
    assert cleaned == {
        "source": "manual",
        "product_url": "https://mercari.example/item",
        "external_item_code": None,
        "shop_name": None,
        "label": "メルカリ",
        "is_primary": True,
    }


def test_validate_rejects_unknown_source() -> None:
    with pytest.raises(ValueError, match="source"):
        svc.validate_external_ref(
            {"source": "ebay", "product_url": "https://example.com"}
        )


def test_normalize_ref_list_ensures_single_primary() -> None:
    refs = svc.normalize_external_refs(
        [
            {
                "source": "rakuten",
                "product_url": "https://r.example/a",
                "external_item_code": "shop:1",
                "shop_name": "A店",
                "is_primary": True,
            },
            {
                "source": "manual",
                "product_url": "https://m.example/b",
                "is_primary": True,
            },
        ]
    )
    primaries = [r for r in refs if r["is_primary"]]
    assert len(primaries) == 1
    assert primaries[0]["source"] == "rakuten"


def test_replace_external_refs_calls_delete_and_insert() -> None:
    calls: list[tuple] = []

    def fake_replace(**kwargs):
        calls.append(("replace", kwargs))
        return [
            {
                "product_external_ref_id": 1,
                "source": "rakuten",
                "product_url": kwargs["refs"][0]["product_url"],
                "external_item_code": "shop:1",
                "shop_name": "A店",
                "label": None,
                "is_primary": True,
            }
        ]

    out = svc.replace_external_refs_for_product(
        members_id="11111111-1111-1111-1111-111111111111",
        access_token="tok",
        registered_product_id=9,
        refs=[
            {
                "source": "rakuten",
                "product_url": "https://r.example/a",
                "external_item_code": "shop:1",
                "shop_name": "A店",
                "is_primary": True,
            }
        ],
        replace_rows=fake_replace,
    )
    assert len(out) == 1
    assert out[0]["source"] == "rakuten"
    assert calls[0][0] == "replace"
    assert calls[0][1]["registered_product_id"] == 9
