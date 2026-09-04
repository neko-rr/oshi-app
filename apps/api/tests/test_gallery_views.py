# TDD: GET/POST/PATCH/DELETE /gallery-views は認証必須。上限20・名前一意。
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

SAMPLE = {
    "gallery_view_id": 1,
    "view_name": "棚Aの缶",
    "q": None,
    "category_tag_ids": [3],
    "storage_location_ids": [9],
    "color_tag_slots": [1],
    "list_sort": "newest",
    "display_order": 0,
}


def test_gallery_views_requires_auth() -> None:
    assert client.get("/gallery-views").status_code == 401
    assert client.post("/gallery-views", json=SAMPLE).status_code == 401
    assert client.patch("/gallery-views/1", json={"view_name": "x"}).status_code == 401
    assert client.delete("/gallery-views/1").status_code == 401


def test_list_gallery_views() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.gallery_views.gallery_view_service.list_gallery_views",
            return_value=[SAMPLE],
        ) as mocked,
    ):
        res = client.get("/gallery-views", headers=AUTH)
    assert res.status_code == 200
    assert res.json() == {"items": [SAMPLE]}
    assert mocked.call_args.kwargs["members_id"] == USER.members_id


def test_create_gallery_view() -> None:
    body = {
        "view_name": "棚Aの缶",
        "q": None,
        "category_tag_ids": [3],
        "storage_location_ids": [9],
        "color_tag_slots": [1],
        "list_sort": "newest",
    }
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.gallery_views.gallery_view_service.create_gallery_view",
            return_value=SAMPLE,
        ) as mocked,
    ):
        res = client.post("/gallery-views", json=body, headers=AUTH)
    assert res.status_code == 200
    assert res.json() == SAMPLE
    assert mocked.call_args.kwargs["view_name"] == "棚Aの缶"
    assert mocked.call_args.kwargs["category_tag_ids"] == [3]


def test_patch_gallery_view_name() -> None:
    updated = {**SAMPLE, "view_name": "棚B"}
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.gallery_views.gallery_view_service.rename_gallery_view",
            return_value=updated,
        ) as mocked,
    ):
        res = client.patch(
            "/gallery-views/1",
            json={"view_name": "棚B"},
            headers=AUTH,
        )
    assert res.status_code == 200
    assert res.json()["view_name"] == "棚B"
    assert mocked.call_args.kwargs["gallery_view_id"] == 1


def test_delete_gallery_view() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.gallery_views.gallery_view_service.delete_gallery_view",
            return_value=True,
        ) as mocked,
    ):
        res = client.delete("/gallery-views/1", headers=AUTH)
    assert res.status_code == 200
    assert res.json() == {"ok": True}
    assert mocked.call_args.kwargs["gallery_view_id"] == 1
