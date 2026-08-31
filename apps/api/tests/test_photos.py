# TDD: POST /photos（IO Vision なし。Storage のみ）
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app
from app.services.photo_service import create_photo_for_member

client = TestClient(app)


def test_create_photo_requires_members_id() -> None:
    with pytest.raises(ValueError, match="members_id"):
        create_photo_for_member(
            "",
            access_token="tok",
            file_bytes=b"abc",
            content_type="image/jpeg",
            filename="a.jpg",
            persist=lambda **_: {"photo_id": 1, "object_path": "x"},
        )


def test_create_photo_persists_and_returns_ids() -> None:
    def fake_persist(**kwargs):
        assert kwargs["members_id"].startswith("1111")
        assert kwargs["file_bytes"] == b"\xff\xd8"
        return {
            "photo_id": 12,
            "object_path": "1111/uuid.jpg",
        }

    out = create_photo_for_member(
        "11111111-1111-1111-1111-111111111111",
        access_token="tok",
        file_bytes=b"\xff\xd8",
        content_type="image/jpeg",
        filename="front.jpg",
        persist=fake_persist,
    )
    assert out["photo_id"] == 12
    assert out["photo_thumbnail_path"] == "1111/uuid.jpg"
    assert out["photo_high_resolution_path"] == "1111/uuid.jpg"


def test_post_photos_requires_auth() -> None:
    res = client.post(
        "/photos",
        files={"file": ("a.jpg", b"abc", "image/jpeg")},
    )
    assert res.status_code == 401


def test_post_photos_returns_201() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.photos.create_photo_for_member",
            return_value={
                "photo_id": 3,
                "photo_thumbnail_path": "m/x.jpg",
                "photo_high_resolution_path": "m/x.jpg",
            },
        ),
    ):
        res = client.post(
            "/photos",
            headers={"Authorization": "Bearer fake-jwt"},
            files={"file": ("a.jpg", b"\xff\xd8\xff", "image/jpeg")},
        )
    assert res.status_code == 201
    assert res.json()["photo_id"] == 3
