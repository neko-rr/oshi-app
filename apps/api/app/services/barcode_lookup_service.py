"""楽天商品検索（2026 新API形）。

RAKUTEN_LIVE_CALLS=1 かつ applicationId + accessKey ありで HTTP。
公式: https://webservice.rakuten.co.jp/documentation/ichiba-item-search
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.settings import get_settings

logger = logging.getLogger(__name__)

# 公式ドキュメント version:2026-07-01
RAKUTEN_ENDPOINT = (
    "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701"
)


def _missing() -> dict[str, Any]:
    return {
        "status": "missing_credentials",
        "items": [],
        "message": "楽天APIの認証情報（applicationId と accessKey）が設定されていません。",
        "source": None,
        "keyword": None,
        "suggested_category_name": None,
    }


def _has_credentials(settings: Any) -> bool:
    return bool(
        settings.rakuten_application_id.strip()
        and settings.rakuten_access_key.strip()
    )


def _origin_headers(origin: str) -> dict[str, str]:
    """許可Webサイトと揃える Origin / Referer（サーバーから呼ぶ前提）。"""
    cleaned = (origin or "").strip().rstrip("/")
    if not cleaned:
        return {}
    parsed = urlparse(cleaned)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return {}
    base = f"{parsed.scheme}://{parsed.netloc}"
    return {
        "Origin": base,
        "Referer": f"{base}/",
    }


def _first_image_url(raw: Any) -> str | None:
    """mediumImageUrls が文字列配列でも {imageUrl} 配列でも先頭を取る。"""
    if not isinstance(raw, list) or not raw:
        return None
    first = raw[0]
    if isinstance(first, str):
        cleaned = first.strip()
        return cleaned or None
    if isinstance(first, dict):
        url = first.get("imageUrl") or first.get("image_url")
        if isinstance(url, str) and url.strip():
            return url.strip()
    return None


def _normalize_item(item: dict[str, Any]) -> dict[str, Any]:
    """楽天商品を登録推奨用に正規化（アフィURL優先）。"""
    affiliate = item.get("affiliateUrl")
    plain = item.get("itemUrl")
    product_url = None
    if isinstance(affiliate, str) and affiliate.strip():
        product_url = affiliate.strip()
    elif isinstance(plain, str) and plain.strip():
        product_url = plain.strip()

    catchcopy = item.get("catchcopy")
    shop_name = item.get("shopName")
    item_code = item.get("itemCode")
    genre_id = item.get("genreId")

    return {
        "name": item.get("itemName"),
        "catchcopy": catchcopy if isinstance(catchcopy, str) else None,
        "price": item.get("itemPrice"),
        "product_url": product_url,
        "shop_name": shop_name.strip() if isinstance(shop_name, str) else None,
        "external_item_code": (
            item_code.strip() if isinstance(item_code, str) else None
        ),
        "image_url": _first_image_url(item.get("mediumImageUrls")),
        "genre_id": genre_id if isinstance(genre_id, int) else None,
    }


def _parse_items(data: dict[str, Any]) -> list[dict[str, Any]]:
    """formatVersion=1（Item ネスト）と 2（フラット）の両方を許容。"""
    items: list[dict[str, Any]] = []
    for row in data.get("Items") or []:
        if not isinstance(row, dict):
            continue
        nested = row.get("Item")
        if isinstance(nested, dict):
            items.append(_normalize_item(nested))
        elif "itemName" in row or "itemPrice" in row:
            items.append(_normalize_item(row))
    return items


def _call(keyword: str, *, source: str) -> dict[str, Any]:
    settings = get_settings()
    if not _has_credentials(settings):
        return _missing()
    if not settings.rakuten_live_calls:
        return {
            "status": "live_disabled",
            "items": [],
            "message": "楽天の実呼び出しは無効です（RAKUTEN_LIVE_CALLS=1）。",
            "source": "rakuten",
            "keyword": keyword,
            "suggested_category_name": None,
        }

    params: dict[str, Any] = {
        "applicationId": settings.rakuten_application_id.strip(),
        "accessKey": settings.rakuten_access_key.strip(),
        "keyword": keyword,
        "hits": 10,
        "format": "json",
    }
    if settings.rakuten_affiliate_id.strip():
        params["affiliateId"] = settings.rakuten_affiliate_id.strip()

    headers = _origin_headers(settings.rakuten_origin)
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(RAKUTEN_ENDPOINT, params=params, headers=headers)
        if resp.status_code >= 400:
            logger.warning("楽天 HTTP %s body=%s", resp.status_code, resp.text[:200])
            return {
                "status": "error",
                "items": [],
                "message": "楽天API呼び出しに失敗しました。",
                "source": "rakuten",
                "keyword": keyword,
                "suggested_category_name": None,
            }
        data = resp.json() or {}
        items = _parse_items(data if isinstance(data, dict) else {})
        suggested = None
        if items:
            genre_id = items[0].get("genre_id")
            if isinstance(genre_id, int):
                from app.services.rakuten_genre_service import fetch_genre_name

                suggested = fetch_genre_name(genre_id)
        return {
            "status": "success",
            "items": items,
            "message": "ok",
            "source": source,
            "keyword": keyword,
            "suggested_category_name": suggested,
        }
    except Exception:
        logger.exception("楽天例外")
        return {
            "status": "error",
            "items": [],
            "message": "楽天APIでエラーが発生しました。",
            "source": "rakuten",
            "keyword": keyword,
            "suggested_category_name": None,
        }


def lookup_by_barcode(barcode: str) -> dict[str, Any]:
    code = (barcode or "").strip()
    if not code:
        return {
            "status": "not_ready",
            "items": [],
            "message": "バーコードが空です。",
            "source": None,
            "keyword": None,
            "suggested_category_name": None,
        }
    return _call(code, source="barcode")


def lookup_by_keyword(keyword: str) -> dict[str, Any]:
    kw = (keyword or "").strip()
    if not kw:
        return {
            "status": "not_ready",
            "items": [],
            "message": "キーワードが空です。",
            "source": None,
            "keyword": None,
            "suggested_category_name": None,
        }
    return _call(kw, source="keyword")
