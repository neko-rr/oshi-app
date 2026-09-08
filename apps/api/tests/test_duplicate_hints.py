"""TDD: GET /products/duplicate-hints"""

from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app
from app.services.duplicate_hints_service import get_duplicate_hints

client = TestClient(app)
USER = AuthenticatedUser(
    members_id="22222222-2222-2222-2222-222222222222",
    email="a@example.com",
)
AUTH = {"Authorization": "Bearer fake-jwt"}


def test_duplicate_hints_requires_auth() -> None:
    assert client.get("/products/duplicate-hints").status_code == 401


def test_duplicate_hints_empty_when_no_keys() -> None:
    out = get_duplicate_hints(
        members_id=USER.members_id,
        access_token="tok",
        barcode=None,
        external_item_code=None,
    )
    assert out["match_count"] == 0
    assert out["total_quantity"] == 0
    assert out["sample"] is None


def test_get_duplicate_hints_endpoint() -> None:
    payload = {
        "match_count": 2,
        "total_quantity": 5,
        "sample": {
            "registered_product_id": 9,
            "product_name": "缶",
            "registration_quantity": 3,
        },
        "barcode": "490",
        "external_item_code": "shop:1",
    }
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.products.get_duplicate_hints",
            return_value=payload,
        ) as mocked,
    ):
        res = client.get(
            "/products/duplicate-hints?barcode=490&external_item_code=shop%3A1",
            headers=AUTH,
        )
    assert res.status_code == 200
    assert res.json() == payload
    assert mocked.call_args.kwargs["barcode"] == "490"
    assert mocked.call_args.kwargs["external_item_code"] == "shop:1"
