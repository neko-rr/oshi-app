# TDD: GET/PUT /theme-settings は認証必須。テーマは allowlist。正本は theme_settings。
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


def test_theme_settings_requires_auth() -> None:
    assert client.get("/theme-settings").status_code == 401
    assert client.put("/theme-settings", json={"theme": "default"}).status_code == 401


def test_get_theme_settings_returns_theme() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.theme_settings.theme_service.get_theme",
            return_value="lime-dark",
        ) as mocked,
    ):
        res = client.get("/theme-settings", headers=AUTH)
    assert res.status_code == 200
    assert res.json() == {"theme": "lime-dark"}
    assert mocked.call_args.kwargs["members_id"] == USER.members_id


def test_put_theme_settings_saves_theme() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.theme_settings.theme_service.save_theme",
            return_value="emerald-dark",
        ) as mocked,
    ):
        res = client.put(
            "/theme-settings",
            headers=AUTH,
            json={"theme": "emerald-dark"},
        )
    assert res.status_code == 200
    assert res.json() == {"theme": "emerald-dark"}
    assert mocked.call_args.kwargs["theme"] == "emerald-dark"
    assert mocked.call_args.kwargs["members_id"] == USER.members_id


def test_put_theme_settings_rejects_unknown_theme() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.theme_settings.theme_service.save_theme",
            side_effect=ValueError("未対応のテーマです"),
        ),
    ):
        res = client.put(
            "/theme-settings",
            headers=AUTH,
            json={"theme": "not-a-real-theme"},
        )
    assert res.status_code == 400
    body = res.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
