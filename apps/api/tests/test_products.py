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
    assert "message" not in body or body.get("message") == "ok"
    mocked.assert_called_once()
    kwargs = mocked.call_args
    assert kwargs[0][0] == user.members_id
    assert kwargs[1]["access_token"] == "fake-jwt"
