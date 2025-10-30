"""Rakuten API lookup utilities."""

import os
import re
from typing import Any, Dict, List, Optional

import requests

RAKUTEN_ENDPOINT = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"
APPLICATION_ID = os.getenv("RAKUTEN_APPLICATION_ID")
AFFILIATE_ID = os.getenv("RAKUTEN_AFFILIATE_ID")
DEFAULT_HITS = 10
TIMEOUT = 10


def _missing_credentials_response() -> Dict[str, Any]:
    return {
        "status": "missing_credentials",
        "items": [],
        "message": "楽天APIの認証情報が設定されていません。",
        "source": None,
        "keyword": None,
    }


def _clean_product_name(name: str) -> str:
    """Clean product name by removing unwanted text patterns."""
    if not name:
        return ""

    # Remove common unwanted patterns
    patterns_to_remove = [
        r'\s*送料無料\s*',
        r'\s*代引不可\s*',
        r'\s*メール便対応\s*',
        r'\s*\[.*?\]\s*',  # Remove bracketed content
        r'\s*【.*?】\s*',  # Remove double-bracketed content
        r'\s*楽天市場\s*',
        r'\s*Yahoo!ショッピング\s*',
        r'\s*Amazon\s*',
        r'\s*価格比較\s*',
        r'\s*最安値\s*',
        r'\s*新品\s*',
        r'\s*中古\s*',
        r'\s*即納\s*',
        r'\s*在庫あり\s*',
        r'\s*限定\s*',
        r'\s*予約受付中\s*',
        r'\s*完売\s*',
    ]

    cleaned_name = name
    for pattern in patterns_to_remove:
        cleaned_name = re.sub(pattern, '', cleaned_name, flags=re.IGNORECASE)

    # Clean up extra whitespace
    cleaned_name = re.sub(r'\s+', ' ', cleaned_name).strip()

    return cleaned_name


def _extract_brand_and_series(name: str) -> Dict[str, str]:
    """Extract brand and series information from product name."""
    # Common patterns for anime/merchandise
    patterns = {
        'brand': [
            r'(.+?)\s*[【\[][^\]】]*[】\]]\s*(.+)',  # Brand [content] product
            r'^([^【\[]+?)\s*[【\[](.*?)[】\]]\s*(.+)',  # Brand [series] product
        ],
        'series': [
            r'.*[【\[](.*?)[】\]].*',  # Extract content in brackets
            r'.*[（(](.*?)[）)].*',    # Extract content in parentheses
        ]
    }

    result = {'brand': '', 'series': ''}

    # Try to extract brand
    for pattern in patterns['brand']:
        match = re.search(pattern, name, re.IGNORECASE)
        if match:
            result['brand'] = match.group(1).strip()
            break

    # Try to extract series
    for pattern in patterns['series']:
        match = re.search(pattern, name, re.IGNORECASE)
        if match:
            result['series'] = match.group(1).strip()
            break

    return result


def _normalise_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalised: List[Dict[str, Any]] = []
    for entry in items:
        item = entry.get("Item", {}) if isinstance(entry, dict) else {}

        # Clean product name
        raw_name = item.get("itemName", "")
        cleaned_name = _clean_product_name(raw_name)

        # Extract brand and series
        brand_series = _extract_brand_and_series(raw_name)

        normalised.append(
            {
                "name": cleaned_name,  # Cleaned product name
                "raw_name": raw_name,  # Original name for reference
                "price": item.get("itemPrice"),
                "url": item.get("itemUrl"),
                "affiliateUrl": item.get("affiliateUrl"),
                "mediumImageUrls": [
                    img.get("imageUrl")
                    for img in item.get("mediumImageUrls", [])
                    if isinstance(img, dict) and img.get("imageUrl")
                ],
                "shopName": item.get("shopName"),
                "genreId": item.get("genreId"),
                "itemCode": item.get("itemCode"),
                "jan": item.get("janCode") or item.get("isbnjan"),
                "brand": brand_series.get("brand", ""),
                "series": brand_series.get("series", ""),
                "structured_data": {
                    "product_name": cleaned_name,
                    "works_series_name": brand_series.get("series", ""),
                    "copyright_company_name": brand_series.get("brand", ""),
                    "purchase_price": item.get("itemPrice"),
                }
            }
        )
    return normalised


def _call_rakuten(params: Dict[str, Any]) -> Dict[str, Any]:
    if not APPLICATION_ID:
        return _missing_credentials_response()

    request_params = {
        "applicationId": APPLICATION_ID,
        "format": "json",
        "hits": DEFAULT_HITS,
        "imageFlag": 1,
    }
    if AFFILIATE_ID:
        request_params["affiliateId"] = AFFILIATE_ID
    request_params.update(params)

    try:
        response = requests.get(
            RAKUTEN_ENDPOINT, params=request_params, timeout=TIMEOUT
        )
        response.raise_for_status()
    except requests.RequestException as exc:  # pragma: no cover - ネットワーク依存
        return {
            "status": "error",
            "items": [],
            "message": f"楽天API通信エラー: {exc}",
            "source": params.get("source"),
            "keyword": params.get("keyword"),
        }

    try:
        payload = response.json()
    except ValueError as exc:  # pragma: no cover - JSON解析エラー
        return {
            "status": "error",
            "items": [],
            "message": f"楽天APIレスポンスの解析に失敗しました: {exc}",
            "source": params.get("source"),
            "keyword": params.get("keyword"),
        }

    items = _normalise_items(payload.get("Items", []))
    if not items:
        return {
            "status": "not_found",
            "items": [],
            "message": "該当する商品が見つかりませんでした。",
            "source": params.get("source"),
            "keyword": params.get("keyword"),
        }

    return {
        "status": "success",
        "items": items,
        "message": "楽天市場で商品を取得しました。",
        "source": params.get("source"),
        "keyword": params.get("keyword"),
        "resultCount": payload.get("count"),
    }


def lookup_product(barcode: str) -> Dict[str, Any]:
    """Lookup product information using the provided barcode string."""
    return lookup_product_by_barcode(barcode)


def lookup_product_by_barcode(barcode: str) -> Dict[str, Any]:
    if not barcode:
        return {
            "status": "invalid",
            "items": [],
            "message": "バーコードが空です。",
            "source": "barcode",
            "keyword": None,
        }

    params = {
        "keyword": barcode,
        "source": "barcode",
    }

    # JAN コード向けのパラメータも併用 (ドキュメントに従い省略可能)
    params["isbnjan"] = barcode
    return _call_rakuten(params)


def lookup_product_by_keyword(keyword: str) -> Dict[str, Any]:
    if not keyword:
        return {
            "status": "invalid",
            "items": [],
            "message": "検索キーワードが空です。",
            "source": "description",
            "keyword": None,
        }

    params = {
        "keyword": keyword,
        "source": "description",
    }
    return _call_rakuten(params)
