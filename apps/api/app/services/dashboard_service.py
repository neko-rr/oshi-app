"""ダッシュボード RPC ラッパ。"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.infra.supabase_user import create_user_client
from app.services.color_tag_analytics_service import fetch_color_tag_share

logger = logging.getLogger(__name__)


def empty_dashboard() -> dict[str, Any]:
    return {
        "spend_series": [],
        "product_mix": [],
        "category_tags": [],
        "storage_locations": [],
        "color_tags": [],
        "meta": {},
    }


def _parse(raw: Any) -> dict[str, Any] | None:
    if raw is None:
        return None
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return None
    return raw if isinstance(raw, dict) else None


def fetch_dashboard_charts(
    *,
    access_token: str,
    members_id: str | None = None,
    granularity: str = "month",
    daily_limit: int = 90,
) -> dict[str, Any]:
    base = empty_dashboard()
    gran = (granularity or "month").strip().lower()
    if gran not in ("month", "day"):
        gran = "month"
    lim = max(1, min(int(daily_limit or 90), 366))
    try:
        client = create_user_client(access_token)
        rpc = client.rpc(
            "app_dashboard_charts",
            {"p_granularity": gran, "p_daily_limit": lim},
        ).execute()
        parsed = _parse(rpc.data if hasattr(rpc, "data") else None)
        if parsed:
            for k in base:
                if k in parsed:
                    base[k] = parsed[k]
    except Exception:
        logger.exception("dashboard charts RPC 失敗")
    if members_id:
        try:
            share = fetch_color_tag_share(
                members_id=members_id, access_token=access_token
            )
            base["color_tags"] = share["items"]
            meta = dict(base.get("meta") or {})
            if not isinstance(meta, dict):
                meta = {}
            meta["color_tag_assignment_total"] = share["assignment_total"]
            meta["color_tag_product_total"] = share["product_total"]
            meta["color_tag_untagged_count"] = share["untagged_count"]
            base["meta"] = meta
        except Exception:
            logger.exception("カラータグ割合の集計に失敗")
    return base
