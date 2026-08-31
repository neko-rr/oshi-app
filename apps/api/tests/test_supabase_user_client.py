# -*- coding: utf-8 -*-
"""create_user_client は SyncClientOptions を使う（supabase 2.31+）。"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.core.settings import get_settings
from app.infra.supabase_user import create_user_client


def test_create_user_client_uses_sync_client_options(monkeypatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test")
    get_settings.cache_clear()

    mock_client = MagicMock(name="client")
    with patch("supabase.create_client", return_value=mock_client) as mocked:
        result = create_user_client("user-jwt-token")

    assert result is mock_client
    assert mocked.call_count == 1
    opts = mocked.call_args.kwargs["options"]
    assert opts.__class__.__name__ == "SyncClientOptions"
    assert hasattr(opts, "storage")
    assert opts.headers.get("Authorization") == "Bearer user-jwt-token"
