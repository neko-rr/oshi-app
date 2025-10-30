"""IO Intelligence API client helpers."""

import os
import re
import time
from typing import Any, Dict, List, Tuple

import requests
from retrying import retry

IO_API_URL = os.getenv(
    "IO_INTELLIGENCE_API_URL",
    "https://api.intelligence.io.solutions/api/v1/chat/completions",
)
IO_API_KEY = os.getenv("IO_INTELLIGENCE_API_KEY")
IO_MODEL = os.getenv("IO_INTELLIGENCE_MODEL", "meta-llama/Llama-3.2-90B-Vision-Instruct")
IO_TIMEOUT = int(os.getenv("IO_INTELLIGENCE_TIMEOUT", "10"))


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


def _extract_structured_data(description: str) -> Dict[str, Any]:
    """Extract structured data from IO Intelligence description."""
    structured_data = {
        "character_name": "",
        "works_name": "",
        "works_series_name": "",
        "copyright_company_name": "",
        "product_shape": "",
        "product_type_flags": [],
        "other_tags": [],
        "colors": [],
        "materials": [],
        "features": []
    }

    if not description:
        return structured_data

    # Extract character names (common patterns)
    character_patterns = [
        r'キャラクター[：:]\s*([^。\n,]*)',
        r'キャラクター名[：:]\s*([^。\n,]*)',
        r'キャラ[：:]\s*([^。\n,]*)',
        r'([^、。\n]*)(?:ちゃん|さん|くん|さま)',
        r'([^\s、。\n]*)(?:のイラスト|のフィギュア|のキャラクター)',
    ]

    for pattern in character_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        if matches:
            # Take the first meaningful match
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    structured_data["character_name"] = match.strip()
                    break
            if structured_data["character_name"]:
                break

    # Extract work names (anime/manga titles)
    work_patterns = [
        r'作品[：:]\s*([^。\n,]*)',
        r'アニメ[：:]\s*([^。\n,]*)',
        r'漫画[：:]\s*([^。\n,]*)',
        r'シリーズ[：:]\s*([^。\n,]*)',
        r'([^、。\n]*)(?:のグッズ|のキャラクター|のイラスト)',
    ]

    for pattern in work_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        if matches:
            for match in matches:
                if match.strip() and len(match.strip()) > 1:
                    # Check if it's a known anime/manga title
                    cleaned_match = match.strip()
                    if not any(skip in cleaned_match.lower() for skip in ['の', 'キャラクター', 'キャラ', 'イラスト']):
                        structured_data["works_name"] = cleaned_match
                        break
            if structured_data["works_name"]:
                break

    # Extract product shape/type
    shape_patterns = [
        r'形状[：:]\s*([^。\n,]*)',
        r'タイプ[：:]\s*([^。\n,]*)',
        r'種類[：:]\s*([^。\n,]*)',
        r'(アクリルスタンド|フィギュア|缶バッジ|キーホルダー|タペストリー|ポスター|クリアファイル)',
    ]

    for pattern in shape_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        if matches:
            for match in matches:
                if match.strip():
                    structured_data["product_shape"] = match.strip()
                    break
            break

    # Extract colors
    color_patterns = [
        r'色[：:]\s*([^。\n,]*)',
        r'カラー[：:]\s*([^。\n,]*)',
        r'(赤|青|黄|緑|紫|ピンク|白|黒|オレンジ|茶色|灰色|銀色|金色|虹色)',
    ]

    for pattern in color_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        if matches:
            structured_data["colors"].extend([m.strip() for m in matches if m.strip()])
            break

    # Extract materials
    material_patterns = [
        r'素材[：:]\s*([^。\n,]*)',
        r'材質[：:]\s*([^。\n,]*)',
        r'(プラスチック|アクリル|布|紙|金属|PVC|ABS樹脂)',
    ]

    for pattern in material_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        if matches:
            structured_data["materials"].extend([m.strip() for m in matches if m.strip()])
            break

    # Extract features and other tags
    feature_keywords = [
        '限定', 'イベント', 'コンサート', 'ライブ', '生誕祭', '周年', '復刻',
        'オリジナル', '描き下ろし', 'レア', 'スペシャル', 'プレミアム',
        'セット', 'コンプリート', 'コレクション', 'シリーズ',
        '大サイズ', '小サイズ', '特大', 'ミニ',
        '光る', '発光', 'LED', '蓄光',
        '透明', 'クリア', '半透明',
        '立体', '3D', '浮き出し',
        '箔押し', 'エンボス', 'デボス',
    ]

    # Find features in description
    for keyword in feature_keywords:
        if keyword in description:
            structured_data["features"].append(keyword)

    # Extract other potential tags (nouns and descriptive words)
    # This is a simple extraction - in production, you might want to use NLP libraries
    other_tag_patterns = [
        r'(\w{2,})色',  # Color words
        r'(\w{2,})版',  # Version words
        r'(\w{2,})タイプ',  # Type words
        r'(\w{2,})仕様',  # Specification words
    ]

    found_tags = set()
    for pattern in other_tag_patterns:
        matches = re.findall(pattern, description)
        found_tags.update(matches)

    # Add features and other found tags to other_tags
    structured_data["other_tags"] = list(found_tags) + structured_data["features"]

    # Determine product type flags based on content
    if any(word in description.lower() for word in ['同人', '個人制作', 'インディーズ']):
        structured_data["product_type_flags"].append("doujin")
    else:
        structured_data["product_type_flags"].append("commercial")

    if any(word in description.lower() for word in ['デジタル', 'ダウンロード', 'データ']):
        structured_data["product_type_flags"].append("digital")

    return structured_data


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

    @retry(
        stop_max_attempt_number=3,
        wait_fixed=2000,
        retry_on_exception=lambda exc: isinstance(exc, requests.RequestException),
    )
    def _call_api():
        print(f"IO API describe_image: sending request with timeout={IO_TIMEOUT}s")
        start_time = time.time()
        response = requests.post(
            IO_API_URL, headers=headers, json=payload, timeout=IO_TIMEOUT
        )
        response.raise_for_status()
        elapsed = time.time() - start_time
        print(f"IO API describe_image: response received in {elapsed:.2f}s")
        return response

    try:
        response = _call_api()
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

    # Extract structured data from the description
    structured_data = _extract_structured_data(description)

    return {
        "status": "success",
        "text": description.strip(),
        "structured_data": structured_data,
        "message": "画像から製品説明と構造化データを生成しました。",
    }
