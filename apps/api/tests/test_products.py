# TDD: GET /products は認証必須。実データはサービス経由。
from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app

client = TestClient(app)


def test_list_products_requires_auth() -> None:
    res = client.get("/products")
    assert res.status_code == 401


def test_list_products_returns_items_from_service() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    sample = [
        {
            "registered_product_id": 9,
            "product_name": "缶バッジ",
            "photo_id": 3,
            "photo_thumbnail_path": "m/t.jpg",
            "creation_date": "2026-03-01",
        }
    ]
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.list_products_for_member",
            return_value=sample,
        ) as mocked,
    ):
        res = client.get(
            "/products",
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 200
    body = res.json()
    assert body["items"] == sample
    assert body["members_id"] == user.members_id
    assert body["has_more"] is False
    assert body["limit"] == 48
    assert "message" not in body or body.get("message") == "ok"
    mocked.assert_called_once()


def test_list_products_has_more_when_page_full() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    sample = [
        {
            "registered_product_id": i,
            "product_name": f"p{i}",
            "photo_id": None,
            "photo_thumbnail_path": None,
            "creation_date": None,
        }
        for i in range(2)
    ]
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.list_products_for_member",
            return_value=sample,
        ),
    ):
        res = client.get(
            "/products",
            params={"limit": 2},
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 200
    assert res.json()["has_more"] is True


def test_list_products_passes_barcode_to_service() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.list_products_for_member",
            return_value=[],
        ) as mocked,
    ):
        res = client.get(
            "/products",
            params={"barcode": "4901234567890"},
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 200
    assert mocked.call_args[1]["barcode"] == "4901234567890"
    assert res.json().get("barcode") == "4901234567890"


def test_list_products_passes_tag_filters_and_echoes() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.list_products_for_member",
            return_value=[],
        ) as mocked,
    ):
        res = client.get(
            "/products",
            params={
                "q": "缶",
                "category_tag_id": 3,
                "storage_location_id": 7,
            },
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 200
    body = res.json()
    assert mocked.call_args[1]["q"] == "缶"
    assert mocked.call_args[1]["category_tag_id"] == 3
    assert mocked.call_args[1]["storage_location_id"] == 7
    assert body["q"] == "缶"
    assert body["category_tag_id"] == 3
    assert body["storage_location_id"] == 7
    assert body["has_more"] is False
