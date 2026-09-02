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


def _normalize_item(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": item.get("itemName"),
        "price": item.get("itemPrice"),
        "url": item.get("itemUrl") or item.get("affiliateUrl"),
        "shop": item.get("shopName"),
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
            }
        data = resp.json() or {}
        return {
            "status": "success",
            "items": _parse_items(data if isinstance(data, dict) else {}),
            "message": "ok",
            "source": source,
            "keyword": keyword,
        }
    except Exception:
        logger.exception("楽天例外")
        return {
            "status": "error",
            "items": [],
            "message": "楽天APIでエラーが発生しました。",
            "source": "rakuten",
            "keyword": keyword,
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
        }
    return _call(kw, source="keyword")
