"""Extract product tags from structured data and descriptions."""

import json
import os
from typing import Any, Dict, Iterable, List, Optional

import requests

IO_API_URL = os.getenv(
    "IO_INTELLIGENCE_API_URL",
    "https://api.intelligence.io.solutions/api/v1/chat/completions",
)
IO_API_KEY = os.getenv("IOINTELLIGENCE_API_KEY")
IO_MODEL = os.getenv("IO_INTELLIGENCE_MODEL", "openai/gpt-oss-120b")
IO_TIMEOUT = int(os.getenv("IO_INTELLIGENCE_TIMEOUT", "30"))
DEFAULT_TAG_COUNT = 10


def _format_product_candidates(candidates: Iterable[Dict[str, Any]]) -> str:
    lines: List[str] = []
    for idx, item in enumerate(candidates, start=1):
        if not isinstance(item, dict):
            continue
        name = item.get("name") or ""
        shop = item.get("shopName") or ""
        price = item.get("price")
        jan = item.get("jan") or ""
        code = item.get("itemCode") or ""
        parts = [f"#{idx}"]
        if name:
            parts.append(f"Name: {name}")
        if shop:
            parts.append(f"Shop: {shop}")
        if price is not None:
            parts.append(f"Price: {price}")
        if jan:
            parts.append(f"JAN: {jan}")
        if code:
            parts.append(f"ItemCode: {code}")
        lines.append(" | ".join(parts))
    return "\n".join(lines)


def _parse_tags(raw_text: str) -> List[str]:
    raw_text = raw_text.strip()
    if not raw_text:
        return []

    try:
        parsed = json.loads(raw_text)
        if isinstance(parsed, list):
            return [str(tag).strip() for tag in parsed if str(tag).strip()]
        if isinstance(parsed, dict) and "tags" in parsed:
            tags = parsed["tags"]
            if isinstance(tags, list):
                return [str(tag).strip() for tag in tags if str(tag).strip()]
    except json.JSONDecodeError:
        pass

    separators = ["\n", ",", "・", "|"]
    candidates = [raw_text]
    for sep in separators:
        temp: List[str] = []
        for chunk in candidates:
            temp.extend(chunk.split(sep))
        candidates = temp
    return [tag.strip().strip("-•") for tag in candidates if tag.strip()]


def extract_tags(
    product_candidates: List[Dict[str, Any]], description: Optional[str]
) -> Dict[str, Any]:
    """Generate tags using product search results and description text."""

    if not IO_API_KEY:
        return {
            "status": "missing_credentials",
            "tags": [],
            "message": "IO Intelligence APIキーが設定されていません。",
        }

    if not product_candidates and not description:
        return {
            "status": "not_ready",
            "tags": [],
            "message": "タグ抽出に必要な情報が不足しています。",
        }

    formatted_candidates = _format_product_candidates(product_candidates)
    description_text = description or ""

    instructions = (
        "以下の製品候補情報と画像説明をもとに、推し活グッズ管理に役立つ日本語タグを生成してください。"
        "タグは製品カテゴリ、キャラクター名、作品名、素材、色、イベント名など利用者が絞り込みに使える語を中心にしてください。"
        f"タグは最大{DEFAULT_TAG_COUNT}個、重複しないように。"
        '返答は JSON 配列 (例: ["タグ1", "タグ2"]) のみで行ってください。'
    )

    candidates_block = formatted_candidates or "(商品候補情報なし)"
    description_block = description_text or "(画像説明なし)"

    prompt = (
        f"# 商品候補\n{candidates_block}\n\n"
        f"# 画像説明\n{description_block}\n\n"
        f"# 指示\n{instructions}"
    )

    payload = {
        "model": IO_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "You extract concise tags for merchandise inventory systems.",
            },
            {"role": "user", "content": prompt},
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
            "tags": [],
            "message": f"タグ抽出API通信エラー: {exc}",
        }

    try:
        payload = response.json()
    except ValueError as exc:  # pragma: no cover - JSON解析エラー
        return {
            "status": "error",
            "tags": [],
            "message": f"タグ抽出APIレスポンスの解析に失敗しました: {exc}",
        }

    try:
        content = payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        return {
            "status": "error",
            "tags": [],
            "message": "タグ抽出APIのレスポンスからテキストを取得できませんでした。",
            "raw": payload,
        }

    if isinstance(content, list):
        text_parts: List[str] = []
        for entry in content:
            if isinstance(entry, dict) and entry.get("type") in {"output_text", "text"}:
                text_parts.append(str(entry.get("text", "")))
        raw_text = "\n".join(text_parts).strip()
    else:
        raw_text = str(content).strip()

    tags = _parse_tags(raw_text)
    if not tags:
        return {
            "status": "error",
            "tags": [],
            "message": "タグ抽出結果が空でした。",
            "raw": raw_text,
        }

    return {
        "status": "success",
        "tags": tags,
        "message": "タグ候補を生成しました。",
        "raw": raw_text,
    }
