"""Extract product tags from structured data and descriptions."""

import json
import os
import time
from typing import Any, Dict, Iterable, List, Optional

import requests
from retrying import retry

from services.io_intelligence import (
    IO_API_KEY,
    IO_MODEL,
    IO_TAG_MODEL,
    IO_FALLBACK_MODEL,
    IO_TIMEOUT,
    IO_API_URL,
)
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
    """Robustly parse tags from model output.

    - Prefer strict JSON parsing
    - Strip code fences and meta text
    - Remove obvious stop words and artifacts
    """
    text = (raw_text or "").strip()
    if not text:
        return []

    # Remove code fence blocks like ```json ... ``` or ``` ... ```
    import re
    text = re.sub(r"```[a-zA-Z]*\s*", "", text)
    text = text.replace("```", "").strip()

    # Try JSON first
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            candidates = [str(t).strip() for t in parsed]
        elif isinstance(parsed, dict) and "tags" in parsed and isinstance(parsed["tags"], list):
            candidates = [str(t).strip() for t in parsed["tags"]]
        else:
            candidates = [text]
    except Exception:
        candidates = [text]

    # If still a single blob, split by common separators (including Japanese punctuation)
    if len(candidates) == 1:
        blob = candidates[0]
        for sep in ["\n", ",", "、", "，", "・", "|"]:
            blob = blob.replace(sep, "\n")
        candidates = [p for p in (s.strip() for s in blob.split("\n")) if p]

    # Clean each token
    cleaned: List[str] = []
    STOPWORDS = {
        "json",
        "タグ",
        "タグ候補",
        "商品タグ",
        "商品管理",
        "製品管理",
        "品質管理",
        "在庫管理",
        "画像説明",
        "商品写真説明",
        "写真説明",
        "商品写真",
        "商品説明",
        "品名",
        "価格",
        "特徴",
        "機能",
        "材料",
        "製造日付",
        "ラベル",
        "申し訳ありません",
        "申し訳",
        "状況確認",
        "提供",
        "サポート",
        "ヘルプ",
        "できません",
        "エラー",
        "画像",
        "写真",
        "説明",
        "確認",
        "内容",
        "内容確認",
        "生成",
        "抽出",
        "日本製品",
        "品質",
        "品質保証",
        "高品質",
        "安全性",
        "環境",
        "環境配慮",
        "環境に優しい",
        "エコ",
        "サステナビリティ",
        "持続可能性",
        "技術",
        "革新",
        "製造",
        "設計",
        "材料",
        # Clothing/fashion domain (irrelevant to small goods like keychains)
        "ファッション",
        "カジュアルウェア",
        "スポーツウェア",
        "トレーニングウェア",
        "ランニング",
        "ジムウェア",
        "アウトドア",
        "スポーツ",
        "衣類",
        "服",
        "ウェア",
        "アパレル",
        "靴",
        "シューズ",
        "パンツ",
        "ジャケット",
        "Ｔシャツ",
        "Tシャツ",
        "カラーコード",
        "色番号",
        "色コード",
        "色名",
        "色番号表",
        "色の名前",
        "型番",
        "規格",
        "一覧",
        "JAN",
        "JANコード",
        "配列",
        "返答",
        "返します",
        "日本語",
        "情報",
        "製品候補",
        "分析",
        "関連",
        "を返します",
        "コードブロック",
        "出力",
        "のみ",
        "json配列",
        "JSON配列",
        "例",
        "指示に従って",
        "使わないでください",
        "代わりに",
        "画像説明なし",
        "画像の説明が提供されていません",
        "コードブロックなし",
        "最大",
        "抽出",
        "返却",
        "返す",
        # English meta/business terms to suppress
        "merchandising",
        "stock",
        "stock control",
        "control",
        "product tracking",
        "tracking",
        "retail inventory",
        "inventory",
        "barcode",
        "barcode scanning",
        "scanning",
        "retail",
        # Obvious fashion/brand hallucinations that polluted image tags
        "CHANEL",
        "シャネル",
        "ハンドバッグ",
        "バッグ",
        "サングラス",
        "広告",
        "ハイブランド",
        "ロゴ",
        "市松模様",
        "白い箱",
        "スタイル",
        "モード",
        "デザイン",
    }

    import re
    for token in candidates:
        t = token.strip().strip("'\" []{}“”‘’`")
        # Drop empty or too generic
        if not t:
            continue
        if t.lower() in {"json", "```json", "```"}:
            continue
        if any(sw in t for sw in STOPWORDS):
            continue
        # Drop tokens that clearly look like generic/format labels
        if re.search(r"(コード|番号|一覧|表)$", t):
            continue
        if re.search(r"(カラーコード|色番号|色コード|色名|色番号表)", t):
            continue
        # Purely numeric or mostly digits/symbols
        if re.fullmatch(r"[\d\-\s]+", t):
            continue
        # Drop enumerated/bold artifacts like "2. **Merchandising**"
        if re.match(r"^\d+\s*[\.|、)]", t):
            continue
        if "**" in t:
            continue
        # Avoid very long sentences (likely instruction)
        if len(t) > 24 and " " in t:
            continue
        cleaned.append(t)

    # Deduplicate preserving order
    seen = set()
    result: List[str] = []
    for t in cleaned:
        key = t.lower()
        if key not in seen:
            seen.add(key)
            result.append(t)
    return result


def _semantic_tags_from_description(description: str) -> List[str]:
    """Lightweight heuristic tags (color/material/object/character) extracted from the description text."""
    if not description:
        return []

    import re

    text = description.replace("\u3000", " ")
    normalized = text

    # Helper to deduplicate while preserving order
    seen_lower = set()

    def _dedup(seq: List[str]) -> List[str]:
        result: List[str] = []
        for item in seq:
            candidate = item.strip()
            if not candidate:
                continue
            key = candidate.lower()
            if key in seen_lower:
                continue
            seen_lower.add(key)
            result.append(candidate)
        return result

    # Known vocabularies
    COLOR_VARIANTS = {
        "白色": "白",
        "白い": "白",
        "ホワイト": "白",
        "白": "白",
        "青色": "青",
        "青い": "青",
        "ブルー": "青",
        "青": "青",
        "水色": "水色",
        "ライトブルー": "水色",
        "紺色": "紺",
        "ネイビー": "紺",
        "紺": "紺",
        "灰色": "灰色",
        "グレー": "灰色",
        "オレンジ色": "オレンジ",
        "オレンジ": "オレンジ",
        "赤色": "赤",
        "赤い": "赤",
        "レッド": "赤",
        "赤": "赤",
        "黒色": "黒",
        "ブラック": "黒",
        "黒": "黒",
        "金色": "金色",
        "ゴールド": "金色",
        "銀色": "銀色",
        "シルバー": "銀色",
        "紫色": "紫",
        "パープル": "紫",
        "紫": "紫",
        "緑色": "緑",
        "グリーン": "緑",
        "緑": "緑",
        "黄色": "黄色",
        "イエロー": "黄色",
        "黄": "黄色",
        "ピンク色": "ピンク",
        "ピンク": "ピンク",
        "茶色": "茶色",
        "ブラウン": "茶色",
    }

    MATERIAL_VARIANTS = {
        "シリコン": "シリコン",
        "シリコン製": "シリコン",
        "シリコンや": "シリコン",
        "ゴム": "ゴム",
        "ゴム製": "ゴム",
        "ラバー": "ラバー",
        "PVC": "PVC",
        "pvc": "PVC",
        "アクリル": "アクリル",
        "プラスチック": "プラスチック",
        "金属": "金属",
        "メタル": "金属",
        "布": "布",
        "布製": "布",
        "紙": "紙",
        "紙製": "紙",
        "木製": "木製",
    }

    ITEM_KEYWORDS = [
        "キーホルダー",
        "キーリング",
        "チャーム",
        "ストラップ",
        "マスコット",
        "フィギュア",
        "アクリルスタンド",
        "缶バッジ",
        "ステッカー",
        "ラバーキーホルダー",
        "アクセサリー",
        "雑貨",
        "グッズ",
    ]

    MOTIF_KEYWORDS = [
        "雪だるま",
        "雪の結晶",
        "冬",
        "北海道",
        "キャラクター",
        "動物",
        "鳥",
        "シマエナガ",
        "ペンギン",
        "星",
    ]

    # Collect candidates per category
    colors: List[str] = []
    for variant, canonical in COLOR_VARIANTS.items():
        if variant and variant in normalized:
            colors.append(canonical)
    colors = _dedup(colors)

    materials: List[str] = []
    for variant, canonical in MATERIAL_VARIANTS.items():
        if variant and variant in normalized:
            materials.append(canonical)
    materials = _dedup(materials)

    items: List[str] = []
    for kw in ITEM_KEYWORDS:
        if kw in normalized:
            items.append(kw)
    items = _dedup(items)

    motifs: List[str] = []
    for kw in MOTIF_KEYWORDS:
        if kw in normalized:
            motifs.append(kw)
    motifs = _dedup(motifs)

    names: List[str] = []
    for quoted in re.findall(r"[『「\"]([^』」\"\n]{1,12})[』」\"]", text):
        name = quoted.strip().strip("・,，。:：;；")
        if name and len(name) >= 2:
            names.append(name)
    for latin in re.findall(r"\b[A-Za-z][A-Za-z0-9\-]{2,}\b", text):
        names.append(latin.strip())
    names = _dedup(names)

    # Combine with balanced coverage (item, motif, color, material, name)
    final_tags: List[str] = []
    added_lower = set()

    def push(tag: str):
        candidate = tag.strip()
        if not candidate:
            return
        key = candidate.lower()
        if key in added_lower:
            return
        added_lower.add(key)
        final_tags.append(candidate)

    category_priority = [
        ("item", items),
        ("motif", motifs),
        ("color", colors),
        ("material", materials),
        ("name", names),
    ]

    # First pass: one from each category when available
    for _, bucket in category_priority:
        if len(final_tags) >= 5:
            break
        if bucket:
            push(bucket[0])

    # Second pass: fill remaining slots with leftover values in priority order
    if len(final_tags) < 5:
        for _, bucket in category_priority:
            for candidate in bucket[1:]:
                if len(final_tags) >= 5:
                    break
                push(candidate)
            if len(final_tags) >= 5:
                break

    return final_tags[:5]


def extract_tags(
    product_candidates: List[Dict[str, Any]],
    description: Optional[str],
    image_base64: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate tags using product search results and description text."""

    print(f"DEBUG: extract_tags called with candidates: {len(product_candidates) if product_candidates else 0}, description: {bool(description)}")

    if not IO_API_KEY:
        print("DEBUG: IO_API_KEY is not set")
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
    # Treat non-descriptive placeholders as invalid/empty to force image-based tagging
    _invalid_desc_markers = [
        "画像の説明が提供されていません",
        "画像説明なし",
        "画像が提供されていません",
        "画像を直接確認することができません",
        "please provide the image",
        "ready to describe",
        "i'm ready to help",
    ]
    if any(m in description_text for m in _invalid_desc_markers):
        description_text = ""

    print(f"DEBUG: formatted_candidates: {bool(formatted_candidates)}, description_text: {bool(description_text)}")

    headers = {
        "Authorization": f"Bearer {IO_API_KEY}",
        "Content-Type": "application/json",
    }

    def _call_with_model(model: str, prompt: str) -> Optional[List[str]]:
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a Japanese product tagging assistant. "
                        "Extract concise search tags in Japanese only. "
                        "Do NOT include meta/business terms (inventory, stock control, product tracking, merchandising, retail, barcode, JSON). "
                        "Respond with a JSON array only (e.g., [\"タグ1\", \"タグ2\"])."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }

        @retry(
            stop_max_attempt_number=3,
            wait_fixed=2000,
            retry_on_exception=lambda exc: isinstance(exc, requests.RequestException),
        )
        def _call_api():
            start_time = time.time()
            response = requests.post(IO_API_URL, headers=headers, json=payload, timeout=IO_TIMEOUT)
            response.raise_for_status()
            elapsed = time.time() - start_time
            print(f"IO API extract_tags: model={model}, elapsed={elapsed:.2f}s")
            return response

        try:
            data = _call_api().json()
            content = data["choices"][0]["message"]["content"]
        except Exception as exc:
            print(f"IO API extract_tags: request/parse failed for model={model}: {exc}")
            return None

        if isinstance(content, list):
            text_parts: List[str] = []
            for entry in content:
                if isinstance(entry, dict) and entry.get("type") in {"output_text", "text"}:
                    text_parts.append(str(entry.get("text", "")))
            raw_text = "\n".join(text_parts).strip()
        else:
            raw_text = str(content).strip()

        try:
            print(
                f"DEBUG: extract_tags raw (text model={model}) len={len(raw_text)} preview='{raw_text[:120]}'"
            )
        except Exception:
            pass
        parsed = _parse_tags(raw_text) or None
        try:
            print(f"DEBUG: extract_tags parsed (text model={model}) => {parsed}")
        except Exception:
            pass
        return parsed

    def _image_tags_via_vision(prompt: str, image_b64_with_header: str) -> Optional[List[str]]:
        if not image_b64_with_header:
            return None
        # First try with tag-model directly (URL)
        try:
            payload_tag_first = {
                "model": IO_TAG_MODEL,
                "messages": [
                    {"role": "system", "content": (
                        "You are a Japanese product tagging assistant. "
                        "Extract concise search tags in Japanese only. "
                        "Do NOT include meta/business terms (inventory, stock control, product tracking, merchandising, retail, barcode, JSON). "
                        "Respond with a JSON array only (e.g., [\"タグ1\", \"タグ2\"])."
                    )},
                    {"role": "user", "content": [
                        {"type": "input_text", "text": prompt},
                        {"type": "input_image", "image_url": image_b64_with_header, "mime_type": "image/jpeg"},
                    ]},
                ],
                "temperature": 0.2,
            }
            start_time = time.time()
            resp_tag_first = requests.post(IO_API_URL, headers=headers, json=payload_tag_first, timeout=IO_TIMEOUT)
            resp_tag_first.raise_for_status()
            elapsed = time.time() - start_time
            print(f"IO API extract_tags(image via tag-model): model={IO_TAG_MODEL}, elapsed={elapsed:.2f}s")
            content = resp_tag_first.json()["choices"][0]["message"]["content"]
        except Exception as _e_tag_first:
            content = None

        # If tag-model URL failed, try tag-model with RAW base64
        if not content:
            try:
                b64 = image_b64_with_header.split(",", 1)[1] if "," in image_b64_with_header else image_b64_with_header
                payload_tag_raw_first = {
                    "model": IO_TAG_MODEL,
                    "messages": [
                        {"role": "system", "content": (
                            "You are a Japanese product tagging assistant. "
                            "Extract concise search tags in Japanese only. "
                            "Do NOT include meta/business terms (inventory, stock control, product tracking, merchandising, retail, barcode, JSON). "
                            "Respond with a JSON array only (e.g., [\"タグ1\", \"タグ2\"])."
                        )},
                        {"role": "user", "content": [
                            {"type": "input_text", "text": prompt},
                            {"type": "input_image", "image": b64, "mime_type": "image/jpeg"},
                        ]},
                    ],
                    "temperature": 0.2,
                }
                start_time = time.time()
                resp_tag_raw_first = requests.post(IO_API_URL, headers=headers, json=payload_tag_raw_first, timeout=IO_TIMEOUT)
                resp_tag_raw_first.raise_for_status()
                elapsed = time.time() - start_time
                print(f"IO API extract_tags(image via tag-model RAW): model={IO_TAG_MODEL}, elapsed={elapsed:.2f}s")
                content = resp_tag_raw_first.json()["choices"][0]["message"]["content"]
            except Exception as _e_tag_raw_first:
                content = None

        # If tag-model still did not yield tags, proceed with Vision model attempts
        # First try with image_url (data URI)
        payload = {
            "model": IO_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a Japanese product tagging assistant. "
                        "Extract concise search tags in Japanese only. "
                        "Do NOT include meta/business terms (inventory, stock control, product tracking, merchandising, retail, barcode, JSON). "
                        "Respond with a JSON array only (e.g., [\"タグ1\", \"タグ2\"])."
                    ),
                },
                {
                    "role": "user",
                    "content": [
        {"type": "input_text", "text": prompt},
        {"type": "input_image", "image_url": image_b64_with_header, "mime_type": "image/jpeg"},
                    ],
                },
            ],
            "temperature": 0.2,
        }

        @retry(
            stop_max_attempt_number=3,
            wait_fixed=2000,
            retry_on_exception=lambda exc: isinstance(exc, requests.RequestException),
        )
        def _call_api():
            start_time = time.time()
            response = requests.post(IO_API_URL, headers=headers, json=payload, timeout=IO_TIMEOUT)
            response.raise_for_status()
            elapsed = time.time() - start_time
            print(f"IO API extract_tags(image via vision): model={IO_MODEL}, elapsed={elapsed:.2f}s")
            return response

        try:
            data = _call_api().json()
            content = data["choices"][0]["message"]["content"]
        except Exception as exc:
            print(f"IO API extract_tags(image via vision): request/parse failed: {exc}")
            # Try fallback model if available
            if not IO_FALLBACK_MODEL:
                return None
            try:
                payload["model"] = IO_FALLBACK_MODEL
                start_time = time.time()
                response = requests.post(IO_API_URL, headers=headers, json=payload, timeout=IO_TIMEOUT)
                response.raise_for_status()
                elapsed = time.time() - start_time
                print(f"IO API extract_tags(image via vision): fallback model={IO_FALLBACK_MODEL}, elapsed={elapsed:.2f}s")
                content = response.json()["choices"][0]["message"]["content"]
            except Exception as exc2:
                print(f"IO API extract_tags(image via vision): fallback failed: {exc2}")
                content = None

        # If still empty/None, retry with raw base64 image (no header)
        if not content:
            try:
                b64 = image_b64_with_header.split(",", 1)[1] if "," in image_b64_with_header else image_b64_with_header
                payload_raw = {
                    "model": IO_MODEL,
                    "messages": [
                        {"role": "system", "content": (
                            "You are a Japanese product tagging assistant. "
                            "Extract concise search tags in Japanese only. "
                            "Do NOT include meta/business terms (inventory, stock control, product tracking, merchandising, retail, barcode, JSON). "
                            "Respond with a JSON array only (e.g., [\"タグ1\", \"タグ2\"])."
                        )},
                        {"role": "user", "content": [
                            {"type": "input_text", "text": prompt},
                            {"type": "input_image", "image": b64, "mime_type": "image/jpeg"},
                        ]},
                    ],
                    "temperature": 0.2,
                }
                start_time = time.time()
                response = requests.post(IO_API_URL, headers=headers, json=payload_raw, timeout=IO_TIMEOUT)
                response.raise_for_status()
                elapsed = time.time() - start_time
                print(f"IO API extract_tags(image via vision RAW): model={IO_MODEL}, elapsed={elapsed:.2f}s")
                content = response.json()["choices"][0]["message"]["content"]
            except Exception as exc3:
                print(f"IO API extract_tags(image via vision RAW): failed: {exc3}")

        # If still empty/None, try using IO_TAG_MODEL directly with image payloads
        if not content and IO_TAG_MODEL:
            try:
                payload_tag = dict(payload)
                payload_tag["model"] = IO_TAG_MODEL
                start_time = time.time()
                response = requests.post(IO_API_URL, headers=headers, json=payload_tag, timeout=IO_TIMEOUT)
                response.raise_for_status()
                elapsed = time.time() - start_time
                print(f"IO API extract_tags(image via tag-model): model={IO_TAG_MODEL}, elapsed={elapsed:.2f}s")
                content = response.json()["choices"][0]["message"]["content"]
            except Exception as exc4:
                print(f"IO API extract_tags(image via tag-model): first try failed: {exc4}")

        if not content and IO_TAG_MODEL:
            try:
                if 'b64' not in locals():
                    b64 = image_b64_with_header.split(",", 1)[1] if "," in image_b64_with_header else image_b64_with_header
                payload_tag_raw = {
                    "model": IO_TAG_MODEL,
                    "messages": [
                        {"role": "system", "content": (
                            "You are a Japanese product tagging assistant. "
                            "Extract concise search tags in Japanese only. "
                            "Do NOT include meta/business terms (inventory, stock control, product tracking, merchandising, retail, barcode, JSON). "
                            "Respond with a JSON array only (e.g., [\"タグ1\", \"タグ2\"])."
                        )},
                        {"role": "user", "content": [
                            {"type": "input_text", "text": prompt},
                            {"type": "input_image", "image": b64, "mime_type": "image/jpeg"},
                        ]},
                    ],
                    "temperature": 0.2,
                }
                start_time = time.time()
                response = requests.post(IO_API_URL, headers=headers, json=payload_tag_raw, timeout=IO_TIMEOUT)
                response.raise_for_status()
                elapsed = time.time() - start_time
                print(f"IO API extract_tags(image via tag-model RAW): model={IO_TAG_MODEL}, elapsed={elapsed:.2f}s")
                content = response.json()["choices"][0]["message"]["content"]
            except Exception as exc5:
                print(f"IO API extract_tags(image via tag-model RAW): failed: {exc5}")


        if isinstance(content, list):
            text_parts: List[str] = []
            for entry in content:
                if isinstance(entry, dict) and entry.get("type") in {"output_text", "text"}:
                    text_parts.append(str(entry.get("text", "")))
            raw_text = "\n".join(text_parts).strip()
        else:
            raw_text = str(content).strip()

        try:
            print(
                f"DEBUG: extract_tags raw (vision model={payload.get('model')}) len={len(raw_text)} preview='{raw_text[:120]}'"
            )
        except Exception:
            pass
        parsed = _parse_tags(raw_text) or None
        try:
            print(f"DEBUG: extract_tags parsed (vision model={payload.get('model')}) => {parsed}")
        except Exception:
            pass
        return parsed

    # 個別に最大5個ずつ抽出
    rakuten_tags: List[str] = []
    image_tags: List[str] = []

    if formatted_candidates:
        prompt_rakuten = (
            "以下の製品候補情報から、商品を探しやすくする日本語タグを最大5個抽出してください。"
            "管理・メタ用語（在庫管理, 商品管理, 製品管理, 品質管理, 商品タグ, 画像説明, JSON, 品名, 価格, 特徴, 機能, 材料, 製造日付, Merchandising, Stock Control, Product Tracking, Retail Inventory, Barcode Scanning など）は含めないでください。"
            "さらに次の用語も禁止: 画像, 写真, 説明, 確認, 内容, 生成, 抽出, ラベル, カラーコード, 色番号, 色コード, 色名, 色番号表, 型番, 規格, 一覧, JAN, JANコード。"
            "出力はコードブロックを使わず、JSON配列のみ（例: [\"タグ1\", \"タグ2\"]).\n"
            f"# 製品候補\n{formatted_candidates}"
        )
        rakuten_tags = (
            _call_with_model(IO_TAG_MODEL, prompt_rakuten)
            or _call_with_model(IO_FALLBACK_MODEL, prompt_rakuten)
            or []
        )
        rakuten_tags = rakuten_tags[:5]

    # 画像からの直接タグ抽出は、画像がある場合は常に実施（説明の有無に依存しない）
    if image_base64:
        prompt_from_image = (
            "画像から商品に関する日本語タグを最大5個抽出してください。"
            "管理・メタ用語（在庫管理, 商品管理, 製品管理, 品質管理, 商品タグ, 画像説明, JSON, 品名, 価格, 特徴, 機能, 材料, 製造日付, Merchandising, Stock Control, Product Tracking, Retail Inventory, Barcode Scanning など）は含めないでください。"
            "さらに次の用語も禁止: 画像, 写真, 説明, 確認, 内容, 生成, 抽出, 日本製品, 品質, 品質保証, 高品質, 安全性, 環境, 環境配慮, 環境に優しい, エコ, サステナビリティ, 持続可能性, 技術, 革新, 製造, 設計, 材料, ラベル, カラーコード, 色番号, 色コード, 色名, 色番号表, 型番, 規格, 一覧, JAN, JANコード。"
            "衣類・ファッション関連語（ファッション, カジュアルウェア, スポーツウェア, トレーニングウェア, ランニング, ジムウェア, アウトドア, スポーツ, 衣類, 服, ウェア, アパレル, 靴, シューズ, パンツ, ジャケット, Tシャツ）も禁止。"
            "視覚的に確認できる事実のみを出力してください。ブランド名は画像に明確に印刷されている場合のみ含め、推測で書かないこと。"
            "固有名詞（キャラクター名、作品名、ブランド名、動物種名）、色・素材・形状（例: ラバー/アクリル/PVC、キーホルダー/缶バッジ/キーリング/チャーム/ストラップ）など、検索に役立つ具体名詞/名詞句のみ。"
            "出力はコードブロックなしのJSON配列のみ。"
        )
        image_tags = _image_tags_via_vision(prompt_from_image, image_base64) or []
        image_tags = image_tags[:5]

    description_model_tags: List[str] = []
    if description_text:
        prompt_description = (
            "以下の画像説明から、実際に説明文に記載されている語だけを使って、日本語タグを最大5個抽出してください。"
            "素材（例: シリコン, アクリル, PVC, ゴム）、色（例: 白, 青, 黒, ピンク）、写っている物品（例: キーホルダー, 缶バッジ, チャーム）、キャラクター名や作品名、印字されている英字を優先してください。"
            "管理・メタ用語（在庫管理, 商品管理, 製品管理, 品質管理, 商品タグ, 画像説明, JSON, 品名, 価格, 特徴, 機能, 材料, 製造日付 など）は含めないでください。"
            "衣類・ファッション関連語（ファッション, カジュアルウェア, スポーツウェア, トレーニングウェア, ランニング, ジムウェア, アウトドア, スポーツ, 衣類, 服, ウェア, アパレル, 靴, シューズ, パンツ, ジャケット, Tシャツ）も禁止です。"
            "タグは説明文に書かれている語句をそのまま使用し、異なる形へ言い換えないでください。"
            "出力はJSON配列のみ（例: [\"タグ1\", \"タグ2\"]).\n"
            f"# 画像説明\n{description_text}"
        )
        description_model_tags = (
            _call_with_model(IO_TAG_MODEL, prompt_description)
            or _call_with_model(IO_FALLBACK_MODEL, prompt_description)
            or []
        )
        if description_model_tags:
            normalized_text = description_text.replace(" ", "").lower()
            filtered_desc_tags: List[str] = []
            for tag in description_model_tags:
                t = tag.strip()
                if not t:
                    continue
                compact = t.replace(" ", "")
                if (
                    t in description_text
                    or compact in description_text
                    or compact.lower() in normalized_text
                    or t.upper() in description_text
                    or t.lower() in normalized_text
                ):
                    filtered_desc_tags.append(t)
            description_model_tags = filtered_desc_tags[:5]

    # When no image data, rely on description model tags directly
    if not image_base64 and description_model_tags and not image_tags:
        image_tags = description_model_tags[:5]

    # Supplement image tags with description-based tags if they are lacking
    IMAGE_TAG_TARGET = 5
    if description_model_tags:
        for tag in description_model_tags:
            if len(image_tags) >= IMAGE_TAG_TARGET:
                break
            if tag not in image_tags:
                image_tags.append(tag)

    # 最終フォールバック: 画像説明テキストからヒューリスティックにタグ抽出（最低1件返す）
    if description_text and len(image_tags) < IMAGE_TAG_TARGET:
        heuristic_tags = _semantic_tags_from_description(description_text)
        for tag in heuristic_tags:
            if len(image_tags) >= IMAGE_TAG_TARGET:
                break
            if tag not in image_tags:
                image_tags.append(tag)
        if heuristic_tags:
            try:
                print(f"DEBUG: heuristic image tags from description => {heuristic_tags}")
            except Exception:
                pass

    # 画像から直接タグ抽出はVisionモデルのみで行う（テキストモデルには渡さない）
    combined: List[str] = []
    seen = set()
    for tag in image_tags + rakuten_tags:
        t = tag.strip()
        kl = t.lower()
        if t and kl not in seen:
            seen.add(kl)
            combined.append(t)

    if not combined:
        return {"status": "not_ready", "tags": [], "message": "タグ抽出に必要な情報が不足しています。"}

    return {
        "status": "success",
        "tags": combined,
        "message": f"楽天{len(rakuten_tags)}件・画像{len(image_tags)}件のタグを生成しました。",
    }

