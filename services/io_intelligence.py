"""IO Intelligence API client helpers."""

import os
from typing import Any, Dict, List

import requests

IO_API_URL = os.getenv(
    "IO_INTELLIGENCE_API_URL",
    "https://api.intelligence.io.solutions/api/v1/chat/completions",
)
IO_API_KEY = os.getenv("IOINTELLIGENCE_API_KEY")
IO_MODEL = os.getenv("IO_INTELLIGENCE_MODEL", "openai/gpt-oss-120b")
IO_TIMEOUT = int(os.getenv("IO_INTELLIGENCE_TIMEOUT", "30"))


def _extract_text_from_content(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        texts: List[str] = []
        for entry in content:
            if not isinstance(entry, dict):
                continue
            if entry.get("type") in {"output_text", "text"} and entry.get("text"):
                texts.append(entry["text"].strip())
        return "\n".join(texts).strip()
    return ""


def describe_image(image_base64: str) -> Dict[str, Any]:
    """Call IO Intelligence API to describe the provided base64 image."""

    if not IO_API_KEY:
        return {
            "status": "missing_credentials",
            "text": None,
            "message": "IO Intelligence APIキーが設定されていません。",
        }

    if not image_base64:
        return {
            "status": "invalid",
            "text": None,
            "message": "画像データが空です。",
        }

    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    payload = {
        "model": IO_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You are an assistant that describes merchandise photos for inventory and tagging.",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            "Describe the product in the image focusing on brand, character names, colors, "
                            "materials, text printed on the item, and any identifying features."
                        ),
                    },
                    {
                        "type": "input_image",
                        "image": image_base64,
                    },
                ],
            },
        ],
        "temperature": 0.2,
    }

    headers = {
        "Authorization": f"Bearer {IO_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            IO_API_URL, headers=headers, json=payload, timeout=IO_TIMEOUT
        )
        response.raise_for_status()
    except requests.RequestException as exc:  # pragma: no cover - ネットワーク依存
        return {
            "status": "error",
            "text": None,
            "message": f"IO Intelligence API通信エラー: {exc}",
        }

    try:
        payload = response.json()
    except ValueError as exc:  # pragma: no cover - JSON解析エラー
        return {
            "status": "error",
            "text": None,
            "message": f"IO Intelligence APIレスポンスの解析に失敗しました: {exc}",
        }

    try:
        content = payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        return {
            "status": "error",
            "text": None,
            "message": "IO Intelligence APIのレスポンスから説明文を取得できませんでした。",
            "raw": payload,
        }

    description = _extract_text_from_content(content)
    if not description:
        return {
            "status": "error",
            "text": None,
            "message": "IO Intelligence APIの説明文が空でした。",
            "raw": payload,
        }

    return {
        "status": "success",
        "text": description.strip(),
        "message": "画像から製品説明を生成しました。",
    }
