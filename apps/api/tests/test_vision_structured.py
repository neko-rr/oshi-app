# -*- coding: utf-8 -*-
"""Vision 1回応答の structured_data パース。"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.core.settings import get_settings
from app.services import io_intelligence_service
from app.services.io_intelligence_service import parse_vision_content


def test_parse_vision_content_extracts_json_fields():
    raw = """
    了解しました。
    ```json
    {
      "description": "ピンクの缶バッジ",
      "product_type": "缶バッジ",
      "product_name": "限定バッジ",
      "character_name": "みらい",
      "product_group_name": "星団",
      "colors": ["ピンク", "金"],
      "visual_tags": ["キラキラ", "パステル", "アイドル系", "かわいい", "文字入り",
        "ロゴ", "ちびキャラ", "ホログラム", "丸型", "イベント限定", "青み", "可愛い系",
        "きらめき", "推し色", "ラメ", "グリッター"]
    }
    ```
    """
    text, data = parse_vision_content(raw)
    assert text == "ピンクの缶バッジ"
    assert data["product_type"] == "缶バッジ"
    assert data["product_name"] == "限定バッジ"
    assert data["character_name"] == "みらい"
    assert data["product_group_name"] == "星団"
    assert data["colors"] == ["ピンク", "金"]
    assert len(data["visual_tags"]) == 16


def test_parse_vision_content_invalid_json_falls_back_to_text():
    raw = "これはただの説明文です。缶バッジっぽい。"
    text, data = parse_vision_content(raw)
    assert text == raw
    assert data["product_type"] is None
    assert data["colors"] == []
    assert data["visual_tags"] == []


def test_parse_vision_content_caps_visual_tags_at_16():
    tags = [f"tag{i}" for i in range(20)]
    raw = '{"description":"x","visual_tags":' + str(tags).replace("'", '"') + "}"
    _text, data = parse_vision_content(raw)
    assert len(data["visual_tags"]) == 16


def test_describe_image_fills_structured_data_on_success(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("IO_INTELLIGENCE_API_KEY", "test-key")
    monkeypatch.setenv("IO_LIVE_CALLS", "1")
    monkeypatch.setenv("IO_INTELLIGENCE_MODEL", "primary-model")
    get_settings.cache_clear()

    payload = (
        '{"description":"赤アクリル","product_type":"アクリル",'
        '"colors":["赤"],"visual_tags":["クール","透明感"]}'
    )
    good = MagicMock(status_code=200)
    good.json.return_value = {
        "choices": [{"message": {"content": payload}}],
    }
    client = MagicMock()
    client.post.return_value = good
    cm = MagicMock()
    cm.__enter__.return_value = client
    cm.__exit__.return_value = False

    with patch("app.services.io_chat_client.httpx.Client", return_value=cm):
        result = io_intelligence_service.describe_image("data:image/png;base64,AAA")

    assert result["status"] == "success"
    assert result["text"] == "赤アクリル"
    assert result["structured_data"]["product_type"] == "アクリル"
    assert result["structured_data"]["colors"] == ["赤"]
    assert result["structured_data"]["visual_tags"] == ["クール", "透明感"]
