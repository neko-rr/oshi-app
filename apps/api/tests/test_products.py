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
                "category_tag_id": "3,5",
                "storage_location_id": "7",
                "color_tag_slot": "1,2",
            },
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 200
    body = res.json()
    assert mocked.call_args[1]["q"] == "缶"
    assert mocked.call_args[1]["category_tag_ids"] == [3, 5]
    assert mocked.call_args[1]["storage_location_ids"] == [7]
    assert mocked.call_args[1]["color_tag_slots"] == [1, 2]
    assert body["q"] == "缶"
    assert body["category_tag_ids"] == [3, 5]
    assert body["storage_location_ids"] == [7]
    assert body["color_tag_slots"] == [1, 2]
    assert body["has_more"] is False


def test_list_products_passes_edit_view() -> None:
    """編集モードは view=edit のときだけ詳しい項目を取りに行く。"""
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
            params={"view": "edit"},
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 200
    assert mocked.call_args[1]["view"] == "edit"


def test_list_products_omits_view_by_default() -> None:
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
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 200
    assert mocked.call_args[1].get("view") in (None, "")


def test_list_products_passes_exchange_and_want_filters() -> None:
    """交換OK・欲しいは 1 のときだけ一覧取得へ渡す。"""
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
            params={"sales_desired": "1", "want_object": "1"},
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 200
    assert mocked.call_args[1]["sales_desired"] is True
    assert mocked.call_args[1]["want_object"] is True


def test_list_products_passes_ledger_hole_filters() -> None:
    """価格なし・購入日なし・購入月は一覧取得へ渡す。月が不正なら 400。"""
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
                "missing_price": "1",
                "missing_purchase_date": "1",
                "purchase_month": "2026-10",
            },
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 200
    assert mocked.call_args[1]["missing_price"] is True
    assert mocked.call_args[1]["missing_purchase_date"] is True
    assert mocked.call_args[1]["purchase_month"] == "2026-10"

    with patch("app.deps.auth.verify_access_token", return_value=user):
        bad = client.get(
            "/products",
            params={"purchase_month": "2026-13"},
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert bad.status_code == 400
    assert bad.json()["error"]["code"] == "VALIDATION_ERROR"


def test_list_products_passes_hole_and_duplicate_filters() -> None:
    """収納なし・カテゴリなし・写真なし・同じバーコードは一覧取得へ渡す。"""
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
                "missing_category": "1",
                "missing_storage": "1",
                "missing_photo": "1",
                "duplicate_barcode": "1",
            },
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 200
    assert mocked.call_args[1]["missing_category"] is True
    assert mocked.call_args[1]["missing_storage"] is True
    assert mocked.call_args[1]["missing_photo"] is True
    assert mocked.call_args[1]["duplicate_barcode"] is True


def test_list_products_rejects_unknown_view() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    with patch("app.deps.auth.verify_access_token", return_value=user):
        res = client.get(
            "/products",
            params={"view": "full"},
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_list_products_rejects_invalid_color_slot() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    with patch("app.deps.auth.verify_access_token", return_value=user):
        res = client.get(
            "/products",
            params={"color_tag_slot": "9"},
            headers={"Authorization": "Bearer fake-jwt"},
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_bulk_patch_products_requires_auth() -> None:
    res = client.patch(
        "/products/bulk",
        json={
            "registered_product_ids": [1],
            "storage_location_id": 2,
        },
    )
    assert res.status_code == 401


def test_bulk_patch_products_calls_service() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    saved = {"updated_count": 2, "registered_product_ids": [1, 2]}
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.bulk_patch_products_for_member",
            return_value=saved,
        ) as mocked,
    ):
        res = client.patch(
            "/products/bulk",
            headers={"Authorization": "Bearer fake-jwt"},
            json={
                "registered_product_ids": [1, 2],
                "storage_location_id": 9,
            },
        )
    assert res.status_code == 200
    assert res.json() == saved
    assert mocked.call_args.kwargs["registered_product_ids"] == [1, 2]
    assert mocked.call_args.kwargs["storage_location_id"] == 9
    assert mocked.call_args.kwargs["clear_storage_location"] is False


def test_bulk_patch_products_clear_storage() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.bulk_patch_products_for_member",
            return_value={"updated_count": 1, "registered_product_ids": [3]},
        ) as mocked,
    ):
        res = client.patch(
            "/products/bulk",
            headers={"Authorization": "Bearer fake-jwt"},
            json={
                "registered_product_ids": [3],
                "clear_storage_location": True,
            },
        )
    assert res.status_code == 200
    assert mocked.call_args.kwargs["clear_storage_location"] is True


def test_bulk_patch_products_category() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    saved = {"updated_count": 2, "registered_product_ids": [1, 2]}
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.bulk_patch_products_for_member",
            return_value=saved,
        ) as mocked,
    ):
        res = client.patch(
            "/products/bulk",
            headers={"Authorization": "Bearer fake-jwt"},
            json={
                "registered_product_ids": [1, 2],
                "category_tag_id": 4,
            },
        )
    assert res.status_code == 200
    assert mocked.call_args.kwargs["category_tag_id"] == 4
    assert mocked.call_args.kwargs["clear_category_tag"] is False


def test_bulk_patch_products_clear_category() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.products.bulk_patch_products_for_member",
            return_value={"updated_count": 1, "registered_product_ids": [8]},
        ) as mocked,
    ):
        res = client.patch(
            "/products/bulk",
            headers={"Authorization": "Bearer fake-jwt"},
            json={
                "registered_product_ids": [8],
                "clear_category_tag": True,
            },
        )
    assert res.status_code == 200
    assert mocked.call_args.kwargs["clear_category_tag"] is True
