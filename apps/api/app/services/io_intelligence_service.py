"""IO Intelligence（Vision）呼び出し。

既定は HTTP しない。IO_LIVE_CALLS=1 かつキーありで Chat Completions を呼ぶ。
主モデル失敗時は IO_INTELLIGENCE_FALLBACK_MODEL を試す。

1回の呼び出しで説明・商品種類・色・見た目タグを structured_data に載せる。
"""

from __future__ import annotations

import json
import re
from typing import Any

from app.core.settings import get_settings
from app.services.io_chat_client import (
    content_from_completion,
    model_chain,
    post_chat_completions,
)

_VISION_PROMPT = """\
あなたは推し活グッズ（缶バッジ・アクリル・フィギュア等）の見た目分析アシスタントです。
画像を見て、次の JSON だけを返してください（前後の説明文は不要）。

{
  "description": "短い日本語の説明",
  "product_type": "商品種類（例: 缶バッジ / アクリル / フィギュア / 紙類 / ぬいぐるみ / その他）",
  "product_name": "分かれば商品名。不明なら空文字",
  "character_name": "分かればキャラ名。不明なら空文字",
  "product_group_name": "分かれば作品・グループ名。不明なら空文字",
  "colors": ["目立つ色名を複数"],
  "visual_tags": ["見た目タグを12〜16個。色・雰囲気（キラキラ等）・何系（アイドル系等）を多めに"]
}

ルール:
- visual_tags は推し活グッズの見た目に関する語だけ（価格や店舗名は入れない）
- product_type は種類を1つ
- JSON 以外は出力しない
"""

_EMPTY_STRUCTURED: dict[str, Any] = {
    "description": None,
    "product_type": None,
    "product_name": None,
    "character_name": None,
    "product_group_name": None,
    "colors": [],
    "visual_tags": [],
}


def _as_str_list(value: Any, *, limit: int) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        text = str(item).strip() if item is not None else ""
        if text and text not in out:
            out.append(text)
        if len(out) >= limit:
            break
    return out


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _extract_json_object(raw: str) -> dict[str, Any] | None:
    """生テキストから最初の JSON オブジェクトを取り出す。"""
    text = (raw or "").strip()
    if not text:
        return None

    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL | re.IGNORECASE)
    candidates: list[str] = []
    if fence:
        candidates.append(fence.group(1))
    candidates.append(text)

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        candidates.append(text[start : end + 1])

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed
    return None


def parse_vision_content(raw: str | None) -> tuple[str | None, dict[str, Any]]:
    """モデル応答を (表示用 text, structured_data) に正規化する。"""
    if raw is None or not str(raw).strip():
        return None, dict(_EMPTY_STRUCTURED)

    raw_text = str(raw).strip()
    parsed = _extract_json_object(raw_text)
    if parsed is None:
        data = dict(_EMPTY_STRUCTURED)
        data["description"] = raw_text
        return raw_text, data

    description = _optional_str(parsed.get("description"))
    visual_tags = _as_str_list(parsed.get("visual_tags"), limit=16)
    colors = _as_str_list(parsed.get("colors"), limit=12)
    data = {
        "description": description,
        "product_type": _optional_str(parsed.get("product_type")),
        "product_name": _optional_str(parsed.get("product_name")),
        "character_name": _optional_str(parsed.get("character_name")),
        "product_group_name": _optional_str(parsed.get("product_group_name")),
        "colors": colors,
        "visual_tags": visual_tags,
    }
    text = description or raw_text
    return text, data


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
                {"type": "text", "text": _VISION_PROMPT},
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
        max_tokens=1200,
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

    raw = content_from_completion(result.get("data") or {})
    text, structured = parse_vision_content(raw)
    return {
        "status": "success",
        "text": text,
        "structured_data": structured,
        "message": "ok",
        "model": result.get("model"),
    }
