# TDD: タグ並び替え・プリセット非表示の純関数と API 契約
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app
from app.services import tag_service

client = TestClient(app)

USER = AuthenticatedUser(
    members_id="22222222-2222-2222-2222-222222222222",
    email="a@example.com",
)
AUTH = {"Authorization": "Bearer fake-jwt"}


def test_validate_reorder_ids_rejects_unknown_id() -> None:
    with pytest.raises(ValueError, match="存在しない"):
        tag_service.validate_reorder_ids([1, 2], [2, 99])


def test_validate_reorder_ids_rejects_duplicate() -> None:
    with pytest.raises(ValueError, match="重複"):
        tag_service.validate_reorder_ids([1, 2], [1, 1])


def test_validate_reorder_ids_requires_full_set() -> None:
    with pytest.raises(ValueError, match="件数"):
        tag_service.validate_reorder_ids([1, 2, 3], [1, 2])


def test_build_display_order_updates() -> None:
    updates = tag_service.build_display_order_updates([30, 10, 20])
    assert updates == [(30, 1), (10, 2), (20, 3)]


def test_is_preset_slot() -> None:
    assert tag_service.is_preset_slot(1) is True
    assert tag_service.is_preset_slot(6) is True
    assert tag_service.is_preset_slot(None) is False
    assert tag_service.is_preset_slot(7) is False


def test_put_category_tags_order_requires_auth() -> None:
    assert client.put("/category-tags/order", json={"ordered_ids": [1]}).status_code == 401


def test_put_category_tags_order_calls_service() -> None:
    sample = [{"category_tag_id": 2, "category_tag_name": "缶"}]
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.tags.tag_service.reorder_category_tags",
            return_value=sample,
        ) as mocked,
    ):
        res = client.put(
            "/category-tags/order",
            headers=AUTH,
            json={"ordered_ids": [2, 1]},
        )
    assert res.status_code == 200
    assert res.json()["items"] == sample
    assert mocked.call_args.kwargs["ordered_ids"] == [2, 1]


def test_post_restore_category_preset_calls_service() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.tags.tag_service.restore_category_preset",
            return_value={"slot": 3},
        ) as mocked,
    ):
        res = client.post(
            "/category-tags/restore-preset",
            headers=AUTH,
            json={"slot": 3},
        )
    assert res.status_code == 200
    assert res.json() == {"ok": True, "slot": 3}
    assert mocked.call_args.kwargs["slot"] == 3


def test_list_category_tags_includes_dismissed_slots() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.tags.tag_service.list_category_tags",
            return_value=([{"category_tag_id": 1}], [2, 5]),
        ),
    ):
        res = client.get("/category-tags", headers=AUTH)
    assert res.status_code == 200
    body = res.json()
    assert body["dismissed_preset_slots"] == [2, 5]
    assert body["items"][0]["category_tag_id"] == 1


def test_delete_category_preset_records_dismiss() -> None:
    mock_client = MagicMock()
    mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
        {"category_tag_id": 5, "slot": 2, "members_id": USER.members_id}
    ]
    with patch(
        "app.services.tag_service.create_user_client", return_value=mock_client
    ):
        tag_service.delete_category_tag(
            members_id=USER.members_id,
            access_token="jwt",
            category_tag_id=5,
        )
    table_names = [c[0][0] for c in mock_client.table.call_args_list]
    assert "category_tag_preset_slot_dismissed" in table_names
