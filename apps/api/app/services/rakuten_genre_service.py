"""楽天 Genre Search（soft fail）。失敗しても登録フローは続行。"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.settings import get_settings

logger = logging.getLogger(__name__)

RAKUTEN_GENRE_ENDPOINT = (
    "https://openapi.rakuten.co.jp/ichibagt/api/IchibaGenre/Search/20260701"
)


def _origin_headers(origin: str) -> dict[str, str]:
    cleaned = (origin or "").strip().rstrip("/")
    if not cleaned:
        return {}
    parsed = urlparse(cleaned)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return {}
    base = f"{parsed.scheme}://{parsed.netloc}"
    return {"Origin": base, "Referer": f"{base}/"}


def fetch_genre_name(genre_id: int) -> str | None:
    """genreId → ジャンル名。キー未設定・LIVEオフ・失敗時は None。"""
    if not isinstance(genre_id, int) or genre_id <= 0:
        return None
    settings = get_settings()
    if not (
        settings.rakuten_application_id.strip()
        and settings.rakuten_access_key.strip()
    ):
        return None
    if not settings.rakuten_live_calls:
        return None

    params: dict[str, Any] = {
        "applicationId": settings.rakuten_application_id.strip(),
        "accessKey": settings.rakuten_access_key.strip(),
        "genreId": genre_id,
        "format": "json",
    }
    headers = _origin_headers(settings.rakuten_origin)
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(RAKUTEN_GENRE_ENDPOINT, params=params, headers=headers)
        if resp.status_code >= 400:
            logger.warning("楽天 Genre HTTP %s", resp.status_code)
            return None
        data = resp.json() or {}
        if not isinstance(data, dict):
            return None
        # current が現在ジャンル
        current = data.get("current")
        if isinstance(current, dict):
            name = current.get("genreName")
            if isinstance(name, str) and name.strip():
                return name.strip()
        # フォールバック: parents / children 先頭
        for key in ("parents", "children", "siblings"):
            rows = data.get(key)
            if not isinstance(rows, list):
                continue
            for row in rows:
                if not isinstance(row, dict):
                    continue
                nested = row.get("genre") if isinstance(row.get("genre"), dict) else row
                if not isinstance(nested, dict):
                    continue
                name = nested.get("genreName")
                if isinstance(name, str) and name.strip():
                    return name.strip()
        return None
    except Exception:
        logger.exception("楽天 Genre Search 例外（soft fail）")
        return None
