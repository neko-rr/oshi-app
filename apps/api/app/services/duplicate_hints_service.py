"""同じグッズ所持ヒント（barcode OR external_item_code）。"""

from __future__ import annotations

import logging
from typing import Any

from app.infra.supabase_user import create_user_client
from app.services.duplicate_quantity import effective_owned_quantity

logger = logging.getLogger(__name__)


def _qty(row: dict[str, Any]) -> int:
    return effective_owned_quantity(
        row.get("registration_quantity")
        if isinstance(row.get("registration_quantity"), int)
        else None
    )


def get_duplicate_hints(
    *,
    members_id: str,
    access_token: str,
    barcode: str | None = None,
    external_item_code: str | None = None,
) -> dict[str, Any]:
    """自分の所持から barcode / item_code 一致を集計。"""
    mid = (members_id or "").strip()
    token = (access_token or "").strip()
    if not mid or not token:
        raise ValueError("認証情報が空です")

    code = (barcode or "").strip() or None
    item = (external_item_code or "").strip() or None
    if not code and not item:
        return {
            "match_count": 0,
            "total_quantity": 0,
            "sample": None,
            "barcode": None,
            "external_item_code": None,
        }

    client = create_user_client(token)
    by_id: dict[int, dict[str, Any]] = {}

    if code:
        try:
            resp = (
                client.table("registered_product")
                .select(
                    "registered_product_id,product_name,registration_quantity,barcode_number"
                )
                .eq("members_id", mid)
                .eq("barcode_number", code)
                .limit(50)
                .execute()
            )
            for row in list(resp.data or []):
                if not isinstance(row, dict):
                    continue
                pid = row.get("registered_product_id")
                if isinstance(pid, int):
                    by_id[pid] = row
        except Exception:
            logger.exception("duplicate-hints barcode 検索に失敗")
            raise RuntimeError("所持ヒントの取得に失敗しました") from None

    if item:
        try:
            ref_resp = (
                client.table("product_external_ref")
                .select("registered_product_id")
                .eq("members_id", mid)
                .eq("external_item_code", item)
                .limit(50)
                .execute()
            )
            ref_ids = [
                r.get("registered_product_id")
                for r in list(ref_resp.data or [])
                if isinstance(r, dict)
                and isinstance(r.get("registered_product_id"), int)
            ]
            missing = [i for i in ref_ids if i not in by_id]
            if missing:
                prod_resp = (
                    client.table("registered_product")
                    .select(
                        "registered_product_id,product_name,registration_quantity,barcode_number"
                    )
                    .eq("members_id", mid)
                    .in_("registered_product_id", missing)
                    .execute()
                )
                for row in list(prod_resp.data or []):
                    if not isinstance(row, dict):
                        continue
                    pid = row.get("registered_product_id")
                    if isinstance(pid, int):
                        by_id[pid] = row
        except Exception:
            logger.exception("duplicate-hints item_code 検索に失敗")
            raise RuntimeError("所持ヒントの取得に失敗しました") from None

    rows = list(by_id.values())
    total = sum(_qty(r) for r in rows)
    sample = None
    if rows:
        first = rows[0]
        sample = {
            "registered_product_id": first.get("registered_product_id"),
            "product_name": first.get("product_name"),
            "registration_quantity": first.get("registration_quantity"),
        }
    return {
        "match_count": len(rows),
        "total_quantity": total,
        "sample": sample,
        "barcode": code,
        "external_item_code": item,
    }
