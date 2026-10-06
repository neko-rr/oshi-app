"""カラータグ（製品ラベル）の付与件数と割合。テーマ／推し色とは別。"""

from __future__ import annotations

import logging
from collections import Counter
from typing import Any

from app.infra.supabase_user import create_user_client

logger = logging.getLogger(__name__)

MIN_SLOT = 1
MAX_SLOT = 7


def _as_slot(raw: Any) -> int | None:
    try:
        n = int(raw)
    except (TypeError, ValueError):
        return None
    if n < MIN_SLOT or n > MAX_SLOT:
        return None
    return n


def build_color_tag_share(
    *,
    tags: list[dict[str, Any]],
    assignment_slots: list[int],
    tagged_product_ids: set[Any],
    product_total: int,
) -> dict[str, Any]:
    """tags は slot 定義。assignment_slots は接合表の slot 列。"""
    defined: list[dict[str, Any]] = []
    seen: set[int] = set()
    for tag in tags:
        slot = _as_slot(tag.get("slot"))
        if slot is None or slot in seen:
            continue
        seen.add(slot)
        name = str(tag.get("color_tag_name") or "").strip() or f"slot {slot}"
        color = str(tag.get("color_tag_color") or "").strip()
        defined.append(
            {
                "slot": slot,
                "color_tag_name": name,
                "color_tag_color": color,
            }
        )
    defined.sort(key=lambda row: int(row["slot"]))
    allowed = {int(row["slot"]) for row in defined}
    counts: Counter[int] = Counter()
    for raw in assignment_slots:
        slot = _as_slot(raw)
        if slot is None or slot not in allowed:
            continue
        counts[slot] += 1
    assignment_total = int(sum(counts.values()))
    items: list[dict[str, Any]] = []
    for row in defined:
        slot = int(row["slot"])
        count = int(counts.get(slot, 0))
        share = round(count / assignment_total, 4) if assignment_total else 0.0
        items.append(
            {
                "slot": slot,
                "color_tag_name": row["color_tag_name"],
                "color_tag_color": row["color_tag_color"],
                "count": count,
                "share": share,
            }
        )
    total_products = max(0, int(product_total))
    tagged = len(tagged_product_ids)
    untagged = max(0, total_products - tagged)
    return {
        "items": items,
        "assignment_total": assignment_total,
        "product_total": total_products,
        "untagged_count": untagged,
    }


def fetch_color_tag_share(*, members_id: str, access_token: str) -> dict[str, Any]:
    client = create_user_client(access_token)
    tags_resp = (
        client.table("color_tag")
        .select("slot,color_tag_name,color_tag_color")
        .eq("members_id", members_id)
        .order("slot")
        .execute()
    )
    tags = [row for row in (tags_resp.data or []) if isinstance(row, dict)]
    links_resp = (
        client.table("registered_product_color_tag")
        .select("slot,registered_product_id")
        .eq("members_id", members_id)
        .execute()
    )
    assignment_slots: list[int] = []
    tagged_ids: set[Any] = set()
    for row in links_resp.data or []:
        if not isinstance(row, dict):
            continue
        slot = _as_slot(row.get("slot"))
        if slot is None:
            continue
        assignment_slots.append(slot)
        pid = row.get("registered_product_id")
        if pid is not None:
            tagged_ids.add(pid)
    prod_resp = (
        client.table("registered_product")
        .select("registered_product_id", count="exact", head=True)
        .eq("members_id", members_id)
        .execute()
    )
    product_total = int(getattr(prod_resp, "count", None) or 0)
    return build_color_tag_share(
        tags=tags,
        assignment_slots=assignment_slots,
        tagged_product_ids=tagged_ids,
        product_total=product_total,
    )
