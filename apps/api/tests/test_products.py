# TDD: 未実装一覧は認証必須で空配列
from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app

client = TestClient(app)


def test_list_products_requires_auth() -> None:
    res = client.get("/products")
    assert res.status_code == 401


def test_list_products_empty_when_authed() -> None:
    user = AuthenticatedUser(
        members_id="22222222-2222-2222-2222-222222222222",
        email="a@example.com",
    )
    with patch("app.deps.auth.verify_access_token", return_value=user):
        res = client.get(
            "/products",
            headers={"Authorization": "Bearer x"},
        )
    assert res.status_code == 200
    body = res.json()
    assert body["items"] == []
    assert body["members_id"] == user.members_id
