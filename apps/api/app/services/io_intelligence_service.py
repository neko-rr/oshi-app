"""IO Intelligence（Vision）呼び出し。

既定は HTTP しない。IO_LIVE_CALLS=1 かつキーありで Chat Completions を呼ぶ。
主モデル失敗時は IO_INTELLIGENCE_FALLBACK_MODEL を試す。
"""

from __future__ import annotations

from typing import Any

from app.core.settings import get_settings
from app.services.io_chat_client import (
    content_from_completion,
    model_chain,
    post_chat_completions,
)


def describe_image(
    image_source: str,
    *,
    raw_base64: str | None = None,
) -> dict[str, Any]:
    _ = raw_base64
    settings = get_settings()
    if not settings.io_intelligence_api_key.strip():
        return {
            "status": "missing_credentials",
            "text": None,
            "structured_data": None,
            "message": "IO Intelligence APIキーが設定されていません。",
        }

    if not settings.io_live_calls:
        return {
            "status": "live_disabled",
            "text": None,
            "structured_data": None,
            "message": "IO の実呼び出しは無効です（IO_LIVE_CALLS=1 で有効化）。",
        }

    if not image_source or not str(image_source).strip():
        return {
            "status": "not_ready",
            "text": None,
            "structured_data": None,
            "message": "画像がありません。",
        }

    messages: list[dict[str, Any]] = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "このグッズ画像を日本語で簡潔に説明し、"
                        "キャラ名・作品名・形状が分かれば書いてください。"
                    ),
                },
                {"type": "image_url", "image_url": {"url": image_source}},
            ],
        }
    ]
    models = model_chain(
        settings.io_intelligence_model,
        settings.io_intelligence_fallback_model,
    )
    result = post_chat_completions(
        messages=messages,
        max_tokens=800,
        models=models,
        log_label="IO Vision",
    )
    if not result.get("ok"):
        return {
            "status": "error",
            "text": None,
            "structured_data": None,
            "message": result.get("message") or "IO Vision 呼び出しに失敗しました。",
        }

    text = content_from_completion(result.get("data") or {})
    return {
        "status": "success",
        "text": text,
        "structured_data": None,
        "message": "ok",
        "model": result.get("model"),
    }
