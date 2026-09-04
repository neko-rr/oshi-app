# TDD: GET /products/{id} 詳細
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app
from app.services.product_service import get_product_for_member

client = TestClient(app)


def test_get_product_requires_members_id() -> None:
    with pytest.raises(ValueError, match="members_id"):
        get_product_for_member(
            "",
            access_token="t",
            registered_product_id=1,
            fetch_one=lambda **_: None,
        )


def test_get_product_returns_none_when_missing() -> None:
    assert (
        get_product_for_member(
            "11111111-1111-1111-1111-111111111111",
            access_token="t",
            registered_product_id=99,
            fetch_one=lambda **_: None,
        )
        is None
    )


def test_get_product_normalizes_and_signs() -> None:
    def fake_fetch(**_kwargs):
        return {
            "registered_product_id": 5,
            "product_name": "詳細テスト",
            "photo_id": 2,
            "creation_date": "2026-01-01",
            "memo": "memo",
            "barcode_number": "123",
            "photo": {
                "photo_thumbnail_url": "m/t.jpg",
                "photo_high_resolution_url": "m/h.jpg",
            },
        }

    def fake_sign(*, object_path: str, access_token: str, expires_in: int = 3600):
        return f"https://s/{object_path}"

    detail = get_product_for_member(
        "11111111-1111-1111-1111-111111111111",
        access_token="tok",
        registered_product_id=5,
        fetch_one=fake_fetch,
        sign_object=fake_sign,
    )
    assert detail is not None
    assert detail["registered_product_id"] == 5
    assert detail["memo"] == "memo"
    assert detail["photo_thumbnail_url"] == "https://s/m/t.jpg"
    assert detail["photo_high_resolution_url"] == "https://s/m/h.jpg"


def test_get_products_id_404() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email=None,
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch("app.routers.products.get_product_for_member", return_value=None),
    ):
        res = client.get(
            "/products/1",
            headers={"Authorization": "Bearer x"},
        )
    assert res.status_code == 404


def test_get_products_id_200() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email=None,
    )
    payload = {
        "registered_product_id": 1,
        "product_name": "A",
        "photo_id": None,
        "photo_thumbnail_path": None,
        "photo_thumbnail_url": None,
        "photo_high_resolution_path": None,
        "photo_high_resolution_url": None,
        "creation_date": None,
        "memo": None,
        "barcode_number": None,
    }
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch("app.routers.products.get_product_for_member", return_value=payload),
    ):
        res = client.get(
            "/products/1",
            headers={"Authorization": "Bearer x"},
        )
    assert res.status_code == 200
    assert res.json()["product_name"] == "A"


def test_patch_product_can_clear_purchase_price() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email=None,
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.patch_product_for_member",
            return_value={"registered_product_id": 1, "purchase_price": None},
        ) as mocked,
    ):
        res = client.patch(
            "/products/1",
            headers={"Authorization": "Bearer x"},
            json={"purchase_price": None},
        )
    assert res.status_code == 200
    assert "purchase_price" in mocked.call_args[1]["fields"]
    assert mocked.call_args[1]["fields"]["purchase_price"] is None


def test_normalize_product_detail_includes_currency_code() -> None:
    from app.services.product_service import normalize_product_detail

    detail = normalize_product_detail(
        {
            "registered_product_id": 1,
            "product_name": "A",
            "purchase_price": 1200,
            "currency_code": "USD",
        }
    )
    assert detail["purchase_price"] == 1200
    assert detail["currency_code"] == "USD"


def test_normalize_product_row_includes_price_and_currency() -> None:
    from app.services.product_service import normalize_product_row

    row = normalize_product_row(
        {
            "registered_product_id": 1,
            "product_name": "A",
            "purchase_price": 500,
            "currency_code": "JPY",
        }
    )
    assert row["purchase_price"] == 500
    assert row["currency_code"] == "JPY"


def test_create_product_passes_currency_code() -> None:
    captured: dict = {}

    def fake_insert(**kwargs):
        captured.update(kwargs)
        return 10

    from app.services.product_service import create_product_for_member

    create_product_for_member(
        "11111111-1111-1111-1111-111111111111",
        access_token="tok",
        product_name="グッズ",
        purchase_price=1000,
        currency_code="eur",
        insert_product=fake_insert,
    )
    assert captured["purchase_price"] == 1000
    assert captured["currency_code"] == "EUR"


def test_create_product_drops_currency_when_no_price() -> None:
    captured: dict = {}

    def fake_insert(**kwargs):
        captured.update(kwargs)
        return 11

    from app.services.product_service import create_product_for_member

    create_product_for_member(
        "11111111-1111-1111-1111-111111111111",
        access_token="tok",
        product_name="グッズ",
        purchase_price=None,
        currency_code="JPY",
        insert_product=fake_insert,
    )
    assert captured.get("currency_code") is None


def test_create_product_rejects_unknown_currency_code() -> None:
    from app.services.product_service import create_product_for_member

    with pytest.raises(ValueError, match="currency_code"):
        create_product_for_member(
            "11111111-1111-1111-1111-111111111111",
            access_token="tok",
            product_name="グッズ",
            purchase_price=100,
            currency_code="XXX",
            insert_product=lambda **_: 1,
        )


def test_patch_product_accepts_currency_code() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email=None,
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.patch_product_for_member",
            return_value={
                "registered_product_id": 1,
                "purchase_price": 10,
                "currency_code": "USD",
            },
        ) as mocked,
    ):
        res = client.patch(
            "/products/1",
            headers={"Authorization": "Bearer x"},
            json={"currency_code": "USD"},
        )
    assert res.status_code == 200
    assert mocked.call_args[1]["fields"]["currency_code"] == "USD"


def test_patch_product_clearing_price_also_clears_currency() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email=None,
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.patch_product_for_member",
            return_value={
                "registered_product_id": 1,
                "purchase_price": None,
                "currency_code": None,
            },
        ) as mocked,
    ):
        res = client.patch(
            "/products/1",
            headers={"Authorization": "Bearer x"},
            json={"purchase_price": None},
        )
    assert res.status_code == 200
    assert mocked.call_args[1]["fields"]["purchase_price"] is None
    assert mocked.call_args[1]["fields"]["currency_code"] is None


def test_post_products_rejects_unknown_currency() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    with patch("app.deps.auth.verify_access_token", return_value=user):
        res = client.post(
            "/products",
            headers={"Authorization": "Bearer fake-jwt"},
            json={
                "product_name": "アクスタ",
                "purchase_price": 100,
                "currency_code": "XXX",
            },
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"
