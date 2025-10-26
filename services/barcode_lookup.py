"""Rakuten API lookup utilities."""

import os
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


def _normalise_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalised: List[Dict[str, Any]] = []
    for entry in items:
        item = entry.get("Item", {}) if isinstance(entry, dict) else {}
        normalised.append(
            {
                "name": item.get("itemName"),
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
