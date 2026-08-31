"""タグ抽出。IO_LIVE_CALLS=1 で簡易 LLM 呼び出し。

主モデル（IO_TAG_MODEL）失敗時は IO_INTELLIGENCE_FALLBACK_MODEL を試す。
"""

from __future__ import annotations

from typing import Any

from app.core.settings import get_settings
from app.services.io_chat_client import (
    content_from_completion,
    model_chain,
    post_chat_completions,
)


def extract_tags(
    product_candidates: list[dict[str, Any]] | None,
    description: str | None,
    *,
    image_base64: str | None = None,
) -> dict[str, Any]:
    _ = image_base64
    settings = get_settings()
    if not settings.io_intelligence_api_key.strip():
        return {
            "status": "missing_credentials",
            "tags": [],
            "message": "IO Intelligence APIキーが設定されていません。",
        }
    if not settings.io_live_calls:
        return {
            "status": "live_disabled",
            "tags": [],
            "message": "IO の実呼び出しは無効です（IO_LIVE_CALLS=1）。",
        }
    if not product_candidates and not (description or "").strip():
        return {
            "status": "not_ready",
            "tags": [],
            "message": "タグ抽出に必要な情報が不足しています。",
        }

    prompt = (
        "次の商品情報から日本語タグを最大8個、カンマ区切りで出してください。\n"
        f"説明: {description or ''}\n"
        f"候補: {product_candidates or []}"
    )
    messages = [{"role": "user", "content": prompt}]
    primary = settings.io_tag_model or settings.io_intelligence_model
    models = model_chain(primary, settings.io_intelligence_fallback_model)
    result = post_chat_completions(
        messages=messages,
        max_tokens=200,
        models=models,
        log_label="IO Tags",
    )
    if not result.get("ok"):
        return {
            "status": "error",
            "tags": [],
            "message": result.get("message") or "タグ抽出に失敗しました。",
        }

    text = content_from_completion(result.get("data") or {}) or ""
    tags = [t.strip() for t in str(text).replace("、", ",").split(",") if t.strip()]
    return {
        "status": "success",
        "tags": tags[:8],
        "message": "ok",
        "model": result.get("model"),
    }
