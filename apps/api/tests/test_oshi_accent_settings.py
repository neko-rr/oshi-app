# TDD: GET/PUT /oshi-accent-settings — 認証必須・未 entitlement は保存拒否
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app
from app.services.oshi_accent_service import PremiumRequiredError

client = TestClient(app)

USER = AuthenticatedUser(
    members_id="22222222-2222-2222-2222-222222222222",
    email="a@example.com",
)
AUTH = {"Authorization": "Bearer fake-jwt"}

BODY = {
    "main_hex": "#9f606c",
    "sub_hex": "#6a9bb8",
    "active": True,
    "presets": [],
}


def test_oshi_accent_requires_auth() -> None:
    assert client.get("/oshi-accent-settings").status_code == 401
    assert client.put("/oshi-accent-settings", json=BODY).status_code == 401


def test_get_oshi_accent_returns_defaults_when_not_entitled() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.oshi_accent_settings.oshi_accent_service.get_oshi_accent",
            return_value={
                "main_hex": "#9f606c",
                "sub_hex": "#6a9bb8",
                "main_foreground": "#ffffff",
                "soft_bg": "#e8f0f5",
                "soft_foreground": "#1a1614",
                "active": False,
                "presets": [],
                "entitled": False,
                "max_presets": 3,
            },
        ) as mocked,
    ):
        res = client.get("/oshi-accent-settings", headers=AUTH)
    assert res.status_code == 200
    data = res.json()
    assert data["entitled"] is False
    assert data["active"] is False
    assert data["max_presets"] == 3
    assert mocked.call_args.kwargs["members_id"] == USER.members_id


def test_put_oshi_accent_forbidden_when_not_entitled() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.oshi_accent_settings.oshi_accent_service.save_oshi_accent",
            side_effect=PremiumRequiredError(
                "推し色の保存・適用にはプレミアムが必要です"
            ),
        ),
    ):
        res = client.put("/oshi-accent-settings", json=BODY, headers=AUTH)
    assert res.status_code == 403
    err = res.json()["error"]
    assert err["code"] == "PREMIUM_REQUIRED"


def test_put_oshi_accent_saves_when_entitled() -> None:
    saved = {
        "main_hex": "#9f606c",
        "sub_hex": "#6a9bb8",
        "main_foreground": "#ffffff",
        "soft_bg": "#e8f0f5",
        "soft_foreground": "#1a1614",
        "active": True,
        "presets": [{"name": "推しA", "main_hex": "#9f606c", "sub_hex": "#6a9bb8"}],
        "entitled": True,
        "max_presets": 3,
    }
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.oshi_accent_settings.oshi_accent_service.save_oshi_accent",
            return_value=saved,
        ) as mocked,
    ):
        res = client.put(
            "/oshi-accent-settings",
            json={
                **BODY,
                "presets": [
                    {"name": "推しA", "main_hex": "#9f606c", "sub_hex": "#6a9bb8"}
                ],
            },
            headers=AUTH,
        )
    assert res.status_code == 200
    assert res.json() == saved
    assert mocked.call_args.kwargs["active"] is True


def test_put_oshi_accent_rejects_bad_hex() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.oshi_accent_settings.oshi_accent_service.save_oshi_accent",
            side_effect=ValueError("色の形式が不正です（#RRGGBB）"),
        ),
    ):
        res = client.put(
            "/oshi-accent-settings",
            json={**BODY, "main_hex": "not-a-color"},
            headers=AUTH,
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_save_service_rejects_when_not_entitled() -> None:
    from app.services import oshi_accent_service as svc

    with patch.object(svc, "is_oshi_accent_entitled", return_value=False):
        with pytest.raises(PremiumRequiredError):
            svc.save_oshi_accent(
                members_id=USER.members_id,
                access_token="tok",
                main_hex="#9f606c",
                sub_hex="#6a9bb8",
                active=True,
                presets=[],
            )


def test_save_service_rejects_too_many_presets() -> None:
    from app.services import oshi_accent_service as svc

    presets = [
        {"name": f"p{i}", "main_hex": "#9f606c", "sub_hex": "#6a9bb8"}
        for i in range(4)
    ]
    with (
        patch.object(svc, "is_oshi_accent_entitled", return_value=True),
        patch("app.services.oshi_accent_service.create_user_client"),
    ):
        with pytest.raises(ValueError, match="最大3"):
            svc.save_oshi_accent(
                members_id=USER.members_id,
                access_token="tok",
                main_hex="#9f606c",
                sub_hex="#6a9bb8",
                active=False,
                presets=presets,
            )
