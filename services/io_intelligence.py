"""IO Intelligence API client helpers."""

import os
import re
import time
from typing import Any, Dict, List, Tuple, Optional

import requests
from retrying import retry

IO_API_URL = os.getenv(
    "IO_INTELLIGENCE_API_URL",
    "https://api.intelligence.io.solutions/api/v1/chat/completions",
)
IO_API_KEY = os.getenv("IO_INTELLIGENCE_API_KEY")
IO_MODEL = os.getenv("IO_INTELLIGENCE_MODEL", "meta-llama/Llama-3.2-90B-Vision-Instruct")
IO_TAG_MODEL = os.getenv(
    "IO_TAG_MODEL", "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"
)
IO_FALLBACK_MODEL = os.getenv(
    "IO_INTELLIGENCE_FALLBACK_MODEL", "meta-llama/Llama-3.2-90B-Vision-Instruct"
)
IO_TIMEOUT = int(os.getenv("IO_INTELLIGENCE_TIMEOUT", "30"))

# Use only .env models by default; allow provider fallbacks only if explicitly enabled
_ENABLE_EXTRA_VISION_FALLBACKS = (
    os.getenv("IO_ENABLE_EXTRA_VISION_FALLBACKS", "0").lower() in {"1", "true", "yes"}
)
ADDITIONAL_VISION_MODELS: List[str] = (
    [
        "Qwen/Qwen2.5-VL-32B-Instruct",
        "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
        "mistralai/Mistral-Large-Instruct-2411",
    ]
    if _ENABLE_EXTRA_VISION_FALLBACKS
    else []
)


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


def describe_image(image_source: str, raw_base64: Optional[str] = None) -> Dict[str, Any]:
    """Call IO Intelligence API to describe the provided image.

    image_source: can be a data URI (data:image/jpeg;base64,...) or a public URL (https://...).
    raw_base64: if available, provide the pure base64 (no header) for raw variants.
    """

    print(
        f"DEBUG: describe_image called with image_source length: {len(image_source) if image_source else 0}, raw_b64 provided: {bool(raw_base64)}"
    )
    try:
        print(f"DEBUG: extra vision fallbacks enabled: {_ENABLE_EXTRA_VISION_FALLBACKS}, alt_models={ADDITIONAL_VISION_MODELS}")
    except Exception:
        pass

    if not IO_API_KEY:
        print("DEBUG: IO_API_KEY is not set")
        return {
            "status": "missing_credentials",
            "text": None,
            "message": "IO Intelligence APIキーが設定されていません。",
        }

    # テスト用のAPIキーの場合、モックレスポンスを返す（デバッグ用）
    if IO_API_KEY == "test_key_for_debugging":
        print("DEBUG: Using test API key - returning mock response for development")
        return {
            "status": "success",
            "text": "これはテスト用の画像説明です。アニメキャラクターのイラストで、青い髪の女の子が描かれています。アクリルスタンドの商品です。",
            "structured_data": {
                "character_name": "テストキャラクター",
                "works_name": "テスト作品",
                "works_series_name": "テストシリーズ",
                "copyright_company_name": "",
                "product_shape": "アクリルスタンド",
                "product_type_flags": ["commercial"],
                "other_tags": ["アニメ", "イラスト", "キャラクター"],
                "colors": ["青"],
                "materials": ["アクリル"]
            },
            "message": "画像から製品説明と構造化データを生成しました。",
        }

    if not image_source:
        return {
            "status": "invalid",
            "text": None,
            "message": "画像データが空です。",
        }

    # Derive forms
    original_data_url_or_public = image_source
    computed_raw_b64 = raw_base64
    if not computed_raw_b64 and "," in image_source:
        computed_raw_b64 = image_source.split(",", 1)[1]
    print(
        f"DEBUG: Processing image payloads -> url_len: {len(original_data_url_or_public)}, raw_b64_len: {len(computed_raw_b64) if computed_raw_b64 else 0}"
    )

    def _build_messages(content_list: list, model_name: str) -> Dict[str, Any]:
        return {
            "model": model_name,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a vision assistant that must describe ONLY the provided image in Japanese. "
                        "Do not ask questions. Output a concise, factual paragraph listing brand/character/series/colors/materials/printed text and distinctive features."
                    ),
                },
                {"role": "user", "content": content_list},
            ],
            "temperature": 0.0,
        }

    instruction_text = (
        "日本語でブランド/キャラクター/作品名/色/素材/印字テキスト/特徴を箇条書きで。"
    )

    # Variant A: instruction then image_url（推奨構成）
    content_a = [
        {"type": "text", "text": instruction_text},
        {"type": "image_url", "image_url": original_data_url_or_public},
    ]

    # Variant B: image_url then instruction
    content_b = [
        {"type": "image_url", "image_url": original_data_url_or_public},
        {"type": "text", "text": instruction_text},
    ]

    # Variant C: raw base64 image then instruction（モデルによってはこちらが必要）
    content_c = [
        {"type": "image", "image": computed_raw_b64 or "", "mime_type": "image/jpeg"},
        {"type": "text", "text": instruction_text},
    ]

    # Variant D: instruction then raw base64 image
    content_d = [
        {"type": "text", "text": instruction_text},
        {"type": "image", "image": computed_raw_b64 or "", "mime_type": "image/jpeg"},
    ]

    # Variant E: image only (some providers perform better with no user text)
    content_e = [
        {"type": "image", "image": computed_raw_b64 or "", "mime_type": "image/jpeg"},
    ]

    # Variant F: image_url only（指示文なし）
    content_f = [
        {"type": "image_url", "image_url": original_data_url_or_public},
    ]

    # Variant G: data URI via image_url (if raw available)
    data_uri_from_raw = (
        f"data:image/jpeg;base64,{computed_raw_b64}" if computed_raw_b64 else None
    )
    content_g = (
        [
            {"type": "text", "text": instruction_text},
            {"type": "image_url", "image_url": data_uri_from_raw},
        ]
        if data_uri_from_raw
        else []
    )

    # Variant H group: OpenAI-like content as list（単一要素で試す）
    content_h_list: List[List[Dict[str, Any]]] = []
    try:
        content_h_list.append([{"type": "image_url", "image_url": original_data_url_or_public}])
        if data_uri_from_raw:
            content_h_list.append([{"type": "image_url", "image_url": data_uri_from_raw}])
        if computed_raw_b64:
            content_h_list.append([{"type": "image", "image": computed_raw_b64, "mime_type": "image/jpeg"}])
    except Exception:
        pass

    headers = {
        "Authorization": f"Bearer {IO_API_KEY}",
        "Content-Type": "application/json",
    }

    @retry(
        stop_max_attempt_number=3,
        wait_fixed=2000,
        retry_on_exception=lambda exc: isinstance(exc, requests.RequestException),
    )
    def _call_api(payload: Dict[str, Any]):
        print(f"IO API describe_image: sending request with timeout={IO_TIMEOUT}s")
        start_time = time.time()
        response = requests.post(
            IO_API_URL, headers=headers, json=payload, timeout=IO_TIMEOUT
        )
        response.raise_for_status()
        elapsed = time.time() - start_time
        print(f"IO API describe_image: response received in {elapsed:.2f}s")
        return response

    def _run_variant(content_list: list, model_name: str) -> Tuple[str, Dict[str, Any]]:
        payload_obj = _build_messages(content_list, model_name)
        try:
            resp = _call_api(payload_obj)
        except requests.RequestException as exc:  # pragma: no cover - ネットワーク依存
            return "", {"error": str(exc)}
        try:
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
        except Exception as exc:
            return "", {"error": f"parse_error: {exc}"}
        desc = _extract_text_from_content(content)
        return desc, data

    # 判定関数（汎用英語・日本語非含有は無効）
    def _is_invalid(text: str) -> bool:
        t = (text or "").strip()
        if not t or len(t) < 12:
            return True
        lt = t.lower()
        if any(
            key in lt
            for key in [
                "i'm ready to help",
                "ready to describe",
                "please provide the image",
                "what's the first photo",
                "how can i",
            ]
        ):
            return True
        import re
        # Japanese apology/placeholder indicating image not processed
        jp_apology = [
            "申し訳ありません",
            "画像が提供されていません",
            "画像がありません",
            "画像を提供",
            "指示では画像",
            "画像を直接確認することができません",
            "画像を確認することができません",
            "画像を確認できません",
            "画像を読み込めません",
            "画像が認識",
            "画像が処理できません",
            "画像の説明が提供されていません",
            "画像説明なし",
        ]
        if any(p in t for p in jp_apology):
            return True
        return not bool(re.search(r"[\u3040-\u30ff\u4e00-\u9fff]", t))

    # Try primary model with multiple orders/payload shapes
    used_model = None
    description = ""

    print("DEBUG: Trying primary model (A text->image_url)")
    description, _ = _run_variant(content_a, IO_MODEL)
    if _is_invalid(description):
        print("DEBUG: Vision description invalid on primary(A), retrying primary(B image_url->text)")
        description, _ = _run_variant(content_b, IO_MODEL)
    if _is_invalid(description) and computed_raw_b64:
        print("DEBUG: Vision description invalid on primary(B), retrying primary(D text->raw)")
        description, _ = _run_variant(content_d, IO_MODEL)
    if _is_invalid(description) and computed_raw_b64:
        print("DEBUG: Vision description invalid on primary(D), retrying primary(C raw->text)")
        description, _ = _run_variant(content_c, IO_MODEL)
    if _is_invalid(description) and computed_raw_b64:
        print("DEBUG: Vision description invalid on primary(C), retrying primary(E raw-only)")
        description, _ = _run_variant(content_e, IO_MODEL)
    if _is_invalid(description):
        print("DEBUG: Vision description invalid on primary(E), retrying primary(F image_url-only)")
        description, _ = _run_variant(content_f, IO_MODEL)
    if _is_invalid(description) and content_g:
        print("DEBUG: Vision description invalid on primary(F), retrying primary(G data-uri)")
        description, _ = _run_variant(content_g, IO_MODEL)
    if _is_invalid(description) and content_h_list:
        for idx, ch in enumerate(content_h_list, start=1):
            print(f"DEBUG: Vision invalid so far, trying primary(H{idx}) single-content variant")
            description, _ = _run_variant(ch, IO_MODEL)
            if not _is_invalid(description):
                break

    # Fallback model if still invalid
    if _is_invalid(description) and IO_FALLBACK_MODEL:
        print("DEBUG: Vision description invalid on primary, trying fallback model (A text->image_url)")
        description, _ = _run_variant(content_a, IO_FALLBACK_MODEL)
        if _is_invalid(description):
            print("DEBUG: Vision description invalid on fallback(A), retrying fallback(B image_url->text)")
            description, _ = _run_variant(content_b, IO_FALLBACK_MODEL)
        if _is_invalid(description) and computed_raw_b64:
            print("DEBUG: Vision description invalid on fallback(B), retrying fallback(D text->raw)")
            description, _ = _run_variant(content_d, IO_FALLBACK_MODEL)
        if _is_invalid(description) and computed_raw_b64:
            print("DEBUG: Vision description invalid on fallback(D), retrying fallback(C raw->text)")
            description, _ = _run_variant(content_c, IO_FALLBACK_MODEL)
        if _is_invalid(description) and computed_raw_b64:
            print("DEBUG: Vision description invalid on fallback(C), retrying fallback(E raw-only)")
            description, _ = _run_variant(content_e, IO_FALLBACK_MODEL)
        if _is_invalid(description):
            print("DEBUG: Vision description invalid on fallback(E), retrying fallback(F image_url-only)")
            description, _ = _run_variant(content_f, IO_FALLBACK_MODEL)
        if _is_invalid(description) and content_g:
            print("DEBUG: Vision description invalid on fallback(F), retrying fallback(G data-uri)")
            description, _ = _run_variant(content_g, IO_FALLBACK_MODEL)
        if _is_invalid(description) and content_h_list:
            for idx, ch in enumerate(content_h_list, start=1):
                print(f"DEBUG: Vision invalid so far, trying fallback(H{idx}) single-content variant")
                description, _ = _run_variant(ch, IO_FALLBACK_MODEL)
                if not _is_invalid(description):
                    used_model = IO_FALLBACK_MODEL
                    break
        if not _is_invalid(description):
            used_model = IO_FALLBACK_MODEL

    # Try provider-listed alternative vision models only if enabled
    if _is_invalid(description) and ADDITIONAL_VISION_MODELS:
        for alt_model in ADDITIONAL_VISION_MODELS:
            print(f"DEBUG: Trying alternative vision model: {alt_model} (A text->image_url)")
            description, _ = _run_variant(content_a, alt_model)
            if not _is_invalid(description):
                print(f"DEBUG: Vision description succeeded with model: {alt_model} (A)")
                used_model = alt_model
                break
            print(f"DEBUG: Trying alternative vision model: {alt_model} (B image_url->text)")
            description, _ = _run_variant(content_b, alt_model)
            if not _is_invalid(description):
                print(f"DEBUG: Vision description succeeded with model: {alt_model} (B)")
                used_model = alt_model
                break

    # Extract structured data from the description
    structured_data = _extract_structured_data(description)

    return {
        "status": "success",
        "text": description.strip(),
        "structured_data": structured_data,
        "model_used": used_model or IO_MODEL,
        "message": "画像から製品説明と構造化データを生成しました。",
    }
