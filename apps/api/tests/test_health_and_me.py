# TDD: Red — /health は公開、/me は Bearer 必須
from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app

client = TestClient(app)


def test_health_is_public() -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_me_requires_authorization() -> None:
    res = client.get("/me")
    assert res.status_code == 401
    body = res.json()
    assert "error" in body
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_me_rejects_invalid_token() -> None:
    res = client.get("/me", headers={"Authorization": "Bearer not-a-token"})
    assert res.status_code == 401


def test_me_returns_members_id_when_token_valid() -> None:
    user = AuthenticatedUser(
        members_id="11111111-1111-1111-1111-111111111111",
        email="tester@example.com",
    )
    with patch("app.deps.auth.verify_access_token", return_value=user):
        res = client.get(
            "/me",
            headers={"Authorization": "Bearer fake-valid-token"},
        )
    assert res.status_code == 200
    data = res.json()
    assert data["members_id"] == user.members_id
    assert data["email"] == user.email
