"""楽天検索。RAKUTEN_LIVE_CALLS=1 かつ APPLICATION_ID ありで HTTP。"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.settings import get_settings

logger = logging.getLogger(__name__)

RAKUTEN_ENDPOINT = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"


def _missing() -> dict[str, Any]:
    return {
        "status": "missing_credentials",
        "items": [],
        "message": "楽天APIの認証情報が設定されていません。",
        "source": None,
        "keyword": None,
    }


def _call(keyword: str, *, source: str) -> dict[str, Any]:
    settings = get_settings()
    if not settings.rakuten_application_id.strip():
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
        "keyword": keyword,
        "hits": 10,
        "format": "json",
    }
    if settings.rakuten_affiliate_id.strip():
        params["affiliateId"] = settings.rakuten_affiliate_id.strip()
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(RAKUTEN_ENDPOINT, params=params)
        if resp.status_code >= 400:
            logger.warning("楽天 HTTP %s", resp.status_code)
            return {
                "status": "error",
                "items": [],
                "message": "楽天API呼び出しに失敗しました。",
                "source": "rakuten",
                "keyword": keyword,
            }
        data = resp.json() or {}
        items = []
        for row in data.get("Items") or []:
            item = row.get("Item") if isinstance(row, dict) else None
            if not isinstance(item, dict):
                continue
            items.append(
                {
                    "name": item.get("itemName"),
                    "price": item.get("itemPrice"),
                    "url": item.get("itemUrl"),
                    "shop": item.get("shopName"),
                }
            )
        return {
            "status": "success",
            "items": items,
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
