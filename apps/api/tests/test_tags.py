# TDD: タグ／収納設定 API は認証必須。サービスを mock して契約を固定する。
from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app

client = TestClient(app)

USER = AuthenticatedUser(
    members_id="22222222-2222-2222-2222-222222222222",
    email="a@example.com",
)
AUTH = {"Authorization": "Bearer fake-jwt"}


def test_color_tags_requires_auth() -> None:
    assert client.get("/color-tags").status_code == 401
    assert client.put("/color-tags", json={"entries": []}).status_code == 401


def test_get_color_tags_returns_items() -> None:
    sample = [
        {
            "slot": 1,
            "color_tag_name": "赤",
            "color_tag_color": "#dc3545",
            "members_id": USER.members_id,
        }
    ]
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.tags.tag_service.list_color_tags",
            return_value=sample,
        ) as mocked,
    ):
        res = client.get("/color-tags", headers=AUTH)
    assert res.status_code == 200
    assert res.json() == {"items": sample}
    assert mocked.call_args.kwargs["members_id"] == USER.members_id


def test_put_color_tags_passes_entries() -> None:
    entries = [
        {
            "slot": i,
            "color_tag_name": f"色{i}",
            "color_tag_color": f"#00000{i}",
        }
        for i in range(1, 8)
    ]
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.tags.tag_service.save_color_tags",
            return_value=entries,
        ) as mocked,
    ):
        res = client.put("/color-tags", headers=AUTH, json={"entries": entries})
    assert res.status_code == 200
    assert res.json()["items"] == entries
    assert mocked.call_args.kwargs["entries"] == entries


def test_category_tags_requires_auth() -> None:
    assert client.get("/category-tags").status_code == 401
    assert (
        client.post(
            "/category-tags", json={"category_tag_name": "x"}
        ).status_code
        == 401
    )
    assert client.patch(
        "/category-tags/1",
        json={
            "category_tag_name": "x",
            "category_tag_color": "#112233",
        },
    ).status_code == 401
    assert client.delete("/category-tags/1").status_code == 401


def test_patch_category_tag_calls_service() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.tags.tag_service.update_category_tag",
            return_value=None,
        ) as mocked,
    ):
        res = client.patch(
            "/category-tags/42",
            headers=AUTH,
            json={
                "category_tag_name": "缶バッジ",
                "category_tag_color": "#dc3545",
                "category_tag_icon": "circle",
            },
        )
    assert res.status_code == 200
    assert res.json() == {"ok": True}
    assert mocked.call_args.kwargs["category_tag_id"] == 42
    assert mocked.call_args.kwargs["members_id"] == USER.members_id
    assert mocked.call_args.kwargs["name"] == "缶バッジ"


def test_delete_category_tag_calls_service() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.tags.tag_service.delete_category_tag",
            return_value=None,
        ) as mocked,
    ):
        res = client.delete("/category-tags/7", headers=AUTH)
    assert res.status_code == 200
    assert mocked.call_args.kwargs["category_tag_id"] == 7


def test_storage_locations_requires_auth() -> None:
    assert client.get("/storage-locations").status_code == 401
    assert client.patch(
        "/storage-locations/1",
        json={"storage_location_name": "棚"},
    ).status_code == 401
    assert client.delete("/storage-locations/1").status_code == 401


def test_patch_storage_location_calls_service() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.tags.tag_service.update_storage_location",
            return_value=None,
        ) as mocked,
    ):
        res = client.patch(
            "/storage-locations/3",
            headers=AUTH,
            json={
                "storage_location_name": "机の上",
                "storage_location_icon": "lamp-desk",
            },
        )
    assert res.status_code == 200
    assert res.json() == {"ok": True}
    assert mocked.call_args.kwargs["storage_location_id"] == 3
    assert mocked.call_args.kwargs["name"] == "机の上"


def test_delete_storage_location_calls_service() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.tags.tag_service.delete_storage_location",
            return_value=None,
        ) as mocked,
    ):
        res = client.delete("/storage-locations/9", headers=AUTH)
    assert res.status_code == 200
    assert mocked.call_args.kwargs["storage_location_id"] == 9
