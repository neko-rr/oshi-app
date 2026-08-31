"""ホーム／設定用の件数統計。"""

from __future__ import annotations

import logging
from typing import Any

from app.infra.supabase_user import create_user_client

logger = logging.getLogger(__name__)


def get_product_stats(*, members_id: str, access_token: str) -> dict[str, Any]:
    client = create_user_client(access_token)
    try:
        rpc = client.rpc("app_registration_product_stats").execute()
        rows = rpc.data if hasattr(rpc, "data") else None
        if isinstance(rows, dict):
            rows = [rows]
        if rows and isinstance(rows, list) and isinstance(rows[0], dict):
            row = rows[0]
            ub = int(row.get("unique_barcodes") or 0)
            return {
                "total": int(row.get("total") or 0),
                "total_photos": int(row.get("total_photos") or 0),
                "unique_barcodes": ub,
            }
    except Exception:
        logger.info("stats RPC 失敗 → フォールバック")

    total_resp = (
        client.table("registered_product")
        .select("registered_product_id", count="exact", head=True)
        .eq("members_id", members_id)
        .execute()
    )
    total = int(getattr(total_resp, "count", None) or 0)
    photos_resp = (
        client.table("registered_product")
        .select("registered_product_id", count="exact", head=True)
        .eq("members_id", members_id)
        .not_.is_("photo_id", "null")
        .execute()
    )
    total_photos = int(getattr(photos_resp, "count", None) or 0)
    bc_resp = (
        client.table("registered_product")
        .select("barcode_number")
        .eq("members_id", members_id)
        .execute()
    )
    unique = len(
        {
            str(r.get("barcode_number")).strip()
            for r in (bc_resp.data or [])
            if isinstance(r, dict)
            and r.get("barcode_number")
            and str(r.get("barcode_number")).strip()
        }
    )
    return {
        "total": total,
        "total_photos": total_photos,
        "unique_barcodes": unique,
    }
