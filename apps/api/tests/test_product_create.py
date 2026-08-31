# TDD: POST /products で製品登録（IO / 楽天なし）
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app
from app.services.product_service import create_product_for_member

client = TestClient(app)


def test_create_product_requires_auth() -> None:
    res = client.post("/products", json={"product_name": "テスト"})
    assert res.status_code == 401


def test_create_product_requires_name() -> None:
    with pytest.raises(ValueError, match="製品名"):
        create_product_for_member(
            "11111111-1111-1111-1111-111111111111",
            access_token="tok",
            product_name="  ",
            insert_product=lambda **_: 1,
        )


def test_create_product_calls_insert_with_members_id() -> None:
    captured: dict = {}

    def fake_insert(**kwargs):
        captured.update(kwargs)
        return 99

    mid = "11111111-1111-1111-1111-111111111111"
    result = create_product_for_member(
        mid,
        access_token="user-jwt",
        product_name="缶バッジ",
        barcode_number="490123",
        photo_id=5,
        insert_product=fake_insert,
    )
    assert result == {
        "registered_product_id": 99,
        "product_name": "缶バッジ",
        "photo_id": 5,
    }
    assert captured["members_id"] == mid
    assert captured["access_token"] == "user-jwt"
    assert captured["product_name"] == "缶バッジ"
    assert captured["barcode_number"] == "490123"
    assert captured["photo_id"] == 5


def test_post_products_returns_created() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.create_product_for_member",
            return_value={
                "registered_product_id": 7,
                "product_name": "アクスタ",
                "photo_id": None,
            },
        ) as mocked,
    ):
        res = client.post(
            "/products",
            headers={"Authorization": "Bearer fake-jwt"},
            json={"product_name": "アクスタ", "memo": "メモ"},
        )
    assert res.status_code == 201
    body = res.json()
    assert body["registered_product_id"] == 7
    assert body["product_name"] == "アクスタ"
    mocked.assert_called_once()
    assert mocked.call_args.kwargs["access_token"] == "fake-jwt"
    assert mocked.call_args.kwargs["product_name"] == "アクスタ"
