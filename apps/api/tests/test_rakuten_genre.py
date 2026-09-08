"""TDD: genre soft fail と名前抽出。"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.services.rakuten_genre_service import fetch_genre_name


def test_fetch_genre_name_returns_none_without_credentials() -> None:
    settings = MagicMock()
    settings.rakuten_application_id = ""
    settings.rakuten_access_key = ""
    settings.rakuten_live_calls = True
    with patch("app.services.rakuten_genre_service.get_settings", return_value=settings):
        assert fetch_genre_name(101) is None


def test_fetch_genre_name_parses_current() -> None:
    settings = MagicMock()
    settings.rakuten_application_id = "app"
    settings.rakuten_access_key = "key"
    settings.rakuten_live_calls = True
    settings.rakuten_origin = "https://example.com"

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"current": {"genreName": "缶バッジ"}}

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.get.return_value = mock_resp

    with (
        patch("app.services.rakuten_genre_service.get_settings", return_value=settings),
        patch("app.services.rakuten_genre_service.httpx.Client", return_value=mock_client),
    ):
        assert fetch_genre_name(101) == "缶バッジ"


def test_fetch_genre_name_soft_fails_on_http_error() -> None:
    settings = MagicMock()
    settings.rakuten_application_id = "app"
    settings.rakuten_access_key = "key"
    settings.rakuten_live_calls = True
    settings.rakuten_origin = ""

    mock_resp = MagicMock()
    mock_resp.status_code = 500

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.get.return_value = mock_resp

    with (
        patch("app.services.rakuten_genre_service.get_settings", return_value=settings),
        patch("app.services.rakuten_genre_service.httpx.Client", return_value=mock_client),
    ):
        assert fetch_genre_name(101) is None
