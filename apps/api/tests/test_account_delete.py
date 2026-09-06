# TDD: DELETE /account は認証必須・確認語 DELETE・secret 必須・JWT sub のみ削除。
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app
from app.services import account_delete_service

client = TestClient(app)

USER = AuthenticatedUser(
    members_id="22222222-2222-2222-2222-222222222222",
    email="a@example.com",
)
AUTH = {"Authorization": "Bearer fake-jwt"}


def test_delete_account_requires_auth() -> None:
    res = client.request(
        "DELETE",
        "/account",
        json={"confirmation": "DELETE"},
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "UNAUTHORIZED"


def test_delete_account_rejects_wrong_confirmation() -> None:
    with patch("app.deps.auth.verify_access_token", return_value=USER):
        res = client.request(
            "DELETE",
            "/account",
            headers=AUTH,
            json={"confirmation": "delete"},
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "INVALID_CONFIRMATION"


def test_delete_account_unavailable_without_secret() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.account.account_delete_service.delete_account_for_member",
            side_effect=account_delete_service.AccountDeleteUnavailableError(
                "secret missing"
            ),
        ),
    ):
        res = client.request(
            "DELETE",
            "/account",
            headers=AUTH,
            json={"confirmation": "DELETE"},
        )
    assert res.status_code == 503
    assert res.json()["error"]["code"] == "ACCOUNT_DELETE_UNAVAILABLE"


def test_delete_account_success_calls_service_with_jwt_sub() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.account.account_delete_service.delete_account_for_member",
            return_value=None,
        ) as mocked,
    ):
        res = client.request(
            "DELETE",
            "/account",
            headers=AUTH,
            json={"confirmation": "DELETE"},
        )
    assert res.status_code == 200
    assert res.json() == {"deleted": True}
    assert mocked.call_args.kwargs["members_id"] == USER.members_id


def test_delete_account_for_member_purges_storage_then_auth() -> None:
    order: list[str] = []

    def _purge(members_id: str) -> None:
        order.append(f"purge:{members_id}")

    def _delete(members_id: str) -> None:
        order.append(f"auth:{members_id}")

    with (
        patch(
            "app.services.account_delete_service.purge_member_storage",
            side_effect=_purge,
        ),
        patch(
            "app.services.account_delete_service.delete_auth_user",
            side_effect=_delete,
        ),
    ):
        account_delete_service.delete_account_for_member(
            members_id=USER.members_id
        )

    assert order == [
        f"purge:{USER.members_id}",
        f"auth:{USER.members_id}",
    ]


def test_delete_account_for_member_rejects_blank_id() -> None:
    with pytest.raises(ValueError):
        account_delete_service.delete_account_for_member(members_id="  ")
