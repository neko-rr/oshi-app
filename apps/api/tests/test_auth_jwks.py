# -*- coding: utf-8 -*-
"""API JWT 検証は JWKS のみ（Legacy JWT Secret があっても HS256 優先しない）。"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.core.settings import get_settings
from app.deps.auth import verify_access_token


def test_verify_uses_jwks_even_when_jwt_secret_is_set(monkeypatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "legacy-shared-secret-should-be-ignored")
    monkeypatch.setenv("SUPABASE_JWKS_URL", "https://example.supabase.co/auth/v1/.well-known/jwks.json")
    get_settings.cache_clear()

    signing_key = MagicMock()
    signing_key.key = "public-key-material"
    jwks_client = MagicMock()
    jwks_client.get_signing_key_from_jwt.return_value = signing_key

    with (
        patch("app.deps.auth.PyJWKClient", return_value=jwks_client) as mocked_jwks,
        patch(
            "app.deps.auth.jwt.decode",
            return_value={
                "sub": "11111111-1111-1111-1111-111111111111",
                "email": "a@example.com",
                "exp": 9999999999,
            },
        ) as mocked_decode,
    ):
        user = verify_access_token("header.payload.sig")

    assert user.members_id == "11111111-1111-1111-1111-111111111111"
    mocked_jwks.assert_called_once()
    # HS256 + secret ではなく、JWKS 由来キーで decode する
    assert mocked_decode.call_args.kwargs.get("algorithms") == ["RS256", "ES256"]
    assert mocked_decode.call_args.args[1] == "public-key-material"


def test_verify_fails_clearly_when_jwks_url_missing(monkeypatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("SUPABASE_URL", "")
    monkeypatch.setenv("SUPABASE_JWKS_URL", "")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "should-not-matter")
    get_settings.cache_clear()

    with pytest.raises(HTTPException) as exc:
        verify_access_token("header.payload.sig")
    assert exc.value.status_code == 401
    detail = exc.value.detail
    assert isinstance(detail, dict)
    assert detail.get("code") == "UNAUTHORIZED"
    assert "JWKS" in str(detail.get("message") or "") or "JWT" in str(
        detail.get("message") or ""
    )
