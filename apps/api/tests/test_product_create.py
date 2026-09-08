# TDD: POST /products で製品登録（IO / 楽天なし）
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app
from app.services.product_service import create_product_for_member

client = TestClient(app)

_DEFAULT_DUP_PREFS = {
    "keep_at_hand_count": 1,
    "auto_sales_desired": False,
}


@pytest.fixture(autouse=True)
def _stub_display_settings_for_create():
    with patch(
        "app.services.display_settings_service.get_display_settings",
        return_value=_DEFAULT_DUP_PREFS,
    ):
        yield


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


def test_create_product_records_storage_register_pick() -> None:
    picks: list[dict] = []

    def fake_insert(**_kwargs):
        return 42

    def fake_pick(**kwargs):
        picks.append(kwargs)

    mid = "11111111-1111-1111-1111-111111111111"
    create_product_for_member(
        mid,
        access_token="user-jwt",
        product_name="アクスタ",
        storage_location_id=8,
        insert_product=fake_insert,
        record_storage_pick=fake_pick,
    )
    assert picks == [
        {
            "members_id": mid,
            "access_token": "user-jwt",
            "storage_location_id": 8,
        }
    ]


def test_create_product_skips_storage_pick_when_no_location() -> None:
    picks: list[dict] = []

    create_product_for_member(
        "11111111-1111-1111-1111-111111111111",
        access_token="user-jwt",
        product_name="アクスタ",
        insert_product=lambda **_: 1,
        record_storage_pick=lambda **kwargs: picks.append(kwargs),
    )
    assert picks == []


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


def test_create_product_passes_external_refs() -> None:
    captured: dict = {}

    def fake_insert(**kwargs):
        captured["insert"] = kwargs
        return 55

    with patch(
        "app.services.product_external_ref_service.replace_external_refs_for_product",
        return_value=[],
    ) as mocked_refs:
        result = create_product_for_member(
            "11111111-1111-1111-1111-111111111111",
            access_token="user-jwt",
            product_name="缶バッジ",
            insert_product=fake_insert,
            external_refs=[
                {
                    "source": "rakuten",
                    "product_url": "https://item.example/aff",
                    "external_item_code": "shop:1",
                    "shop_name": "推し店",
                    "is_primary": True,
                }
            ],
        )
    assert result["registered_product_id"] == 55
    mocked_refs.assert_called_once()
    assert mocked_refs.call_args.kwargs["registered_product_id"] == 55
    assert mocked_refs.call_args.kwargs["refs"][0]["source"] == "rakuten"


def test_create_product_applies_auto_sales_desired() -> None:
    captured: dict = {}

    def fake_insert(**kwargs):
        captured.update(kwargs)
        return 11

    with patch(
        "app.services.display_settings_service.get_display_settings",
        return_value={"keep_at_hand_count": 1, "auto_sales_desired": True},
    ):
        create_product_for_member(
            "11111111-1111-1111-1111-111111111111",
            access_token="user-jwt",
            product_name="ダブり缶",
            registration_quantity=3,
            insert_product=fake_insert,
        )
    assert captured["registration_quantity"] == 3
    assert captured["sales_desired_flag"] == 1
    assert captured["sales_desired_quantity"] == 2
