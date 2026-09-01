# -*- coding: utf-8 -*-
"""バーコード照合は LIVE 無効時 soft status（実楽天 HTTP なし）。"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.core.settings import get_settings
from app.deps.auth import AuthenticatedUser
from app.main import app
from app.services import barcode_lookup_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def _clear_settings():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_lookup_by_barcode_live_disabled_without_http(monkeypatch) -> None:
    monkeypatch.setenv("RAKUTEN_APPLICATION_ID", "dummy-app-id")
    monkeypatch.setenv("RAKUTEN_LIVE_CALLS", "0")
    get_settings.cache_clear()

    with patch("app.services.barcode_lookup_service.httpx.Client") as http_client:
        result = barcode_lookup_service.lookup_by_barcode("4901234567890")

    assert result["status"] == "live_disabled"
    assert result["items"] == []
    http_client.assert_not_called()


def test_lookup_by_barcode_missing_credentials(monkeypatch) -> None:
    monkeypatch.delenv("RAKUTEN_APPLICATION_ID", raising=False)
    monkeypatch.setenv("RAKUTEN_APPLICATION_ID", "")
    monkeypatch.setenv("RAKUTEN_LIVE_CALLS", "0")
    get_settings.cache_clear()

    result = barcode_lookup_service.lookup_by_barcode("4901234567890")
    assert result["status"] == "missing_credentials"
    assert result["items"] == []


def test_assist_barcode_lookup_returns_soft_status() -> None:
    user = AuthenticatedUser(
        members_id="33333333-3333-3333-3333-333333333333",
        email="b@example.com",
    )
    with (
        patch("app.deps.auth.verify_access_token", return_value=user),
        patch(
            "app.routers.assist.lookup_by_barcode",
            return_value={
                "status": "live_disabled",
                "items": [],
                "message": "楽天の実呼び出しは無効です（RAKUTEN_LIVE_CALLS=1）。",
                "source": "rakuten",
                "keyword": "4901",
            },
        ),
    ):
        res = client.post(
            "/assist/barcode/lookup",
            headers={"Authorization": "Bearer fake-jwt"},
            json={"barcode": "4901"},
        )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "live_disabled"
    assert body["items"] == []
