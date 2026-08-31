# -*- coding: utf-8 -*-
"""IO 主モデル失敗時に FALLBACK へ切り替える。"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.core.settings import get_settings
from app.services import io_intelligence_service, tag_extraction_service


def _ok_json(content: str = "説明テキスト") -> dict:
    return {
        "choices": [{"message": {"content": content}}],
    }


def _mock_client(responses: list[MagicMock]):
    """httpx.Client のコンテキストマネージャを差し替える。"""
    client = MagicMock()
    client.post.side_effect = responses
    cm = MagicMock()
    cm.__enter__.return_value = client
    cm.__exit__.return_value = False
    return cm, client


def test_describe_image_falls_back_when_primary_http_error(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("IO_INTELLIGENCE_API_KEY", "test-key")
    monkeypatch.setenv("IO_LIVE_CALLS", "1")
    monkeypatch.setenv("IO_INTELLIGENCE_MODEL", "primary-model")
    monkeypatch.setenv("IO_INTELLIGENCE_FALLBACK_MODEL", "fallback-model")
    get_settings.cache_clear()

    bad = MagicMock(status_code=400, text='{"detail":"model unavailable"}')
    good = MagicMock(status_code=200)
    good.json.return_value = _ok_json("フォールバック成功")
    cm, client = _mock_client([bad, good])

    with patch("app.services.io_chat_client.httpx.Client", return_value=cm):
        result = io_intelligence_service.describe_image("data:image/png;base64,AAA")

    assert result["status"] == "success"
    assert result["text"] == "フォールバック成功"
    assert client.post.call_count == 2
    models = [c.kwargs["json"]["model"] for c in client.post.call_args_list]
    assert models == ["primary-model", "fallback-model"]


def test_describe_image_does_not_call_fallback_on_primary_success(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("IO_INTELLIGENCE_API_KEY", "test-key")
    monkeypatch.setenv("IO_LIVE_CALLS", "1")
    monkeypatch.setenv("IO_INTELLIGENCE_MODEL", "primary-model")
    monkeypatch.setenv("IO_INTELLIGENCE_FALLBACK_MODEL", "fallback-model")
    get_settings.cache_clear()

    good = MagicMock(status_code=200)
    good.json.return_value = _ok_json("主モデル成功")
    cm, client = _mock_client([good])

    with patch("app.services.io_chat_client.httpx.Client", return_value=cm):
        result = io_intelligence_service.describe_image("data:image/png;base64,AAA")

    assert result["status"] == "success"
    assert result["text"] == "主モデル成功"
    assert client.post.call_count == 1


def test_extract_tags_falls_back_when_primary_http_error(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("IO_INTELLIGENCE_API_KEY", "test-key")
    monkeypatch.setenv("IO_LIVE_CALLS", "1")
    monkeypatch.setenv("IO_TAG_MODEL", "tag-primary")
    monkeypatch.setenv("IO_INTELLIGENCE_FALLBACK_MODEL", "tag-fallback")
    get_settings.cache_clear()

    bad = MagicMock(status_code=404, text='{"detail":"not found"}')
    good = MagicMock(status_code=200)
    good.json.return_value = _ok_json("タグA, タグB")
    cm, client = _mock_client([bad, good])

    with patch("app.services.io_chat_client.httpx.Client", return_value=cm):
        result = tag_extraction_service.extract_tags(
            [{"name": "グッズ"}],
            "説明",
        )

    assert result["status"] == "success"
    assert result["tags"][:2] == ["タグA", "タグB"]
    assert client.post.call_count == 2
    models = [c.kwargs["json"]["model"] for c in client.post.call_args_list]
    assert models == ["tag-primary", "tag-fallback"]
