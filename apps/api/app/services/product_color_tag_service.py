"""製品カラータグ（slot 1..7）の付け替え。"""

from __future__ import annotations

from typing import Any

from app.infra.supabase_user import create_user_client


def _clean_slots(slots: list[int] | None) -> list[int]:
    clean: list[int] = []
    seen: set[int] = set()
    for s in slots or []:
        try:
            si = int(s)
        except (TypeError, ValueError):
            continue
        if 1 <= si <= 7 and si not in seen:
            clean.append(si)
            seen.add(si)
        if len(clean) >= 7:
            break
    return clean


def set_product_color_slots(
    *,
    members_id: str,
    access_token: str,
    registered_product_id: int,
    slots: list[int],
) -> list[int]:
    clean = _clean_slots(slots)
    client = create_user_client(access_token)
    client.table("registered_product_color_tag").delete().eq(
        "members_id", members_id
    ).eq("registered_product_id", registered_product_id).execute()
    if clean:
        payload = [
            {
                "members_id": members_id,
                "registered_product_id": registered_product_id,
                "slot": s,
            }
            for s in clean
        ]
        client.table("registered_product_color_tag").insert(payload).execute()
    return clean


def get_color_slots_for_products(
    *,
    members_id: str,
    access_token: str,
    product_ids: list[int],
) -> dict[int, list[int]]:
    if not product_ids:
        return {}
    client = create_user_client(access_token)
    resp = (
        client.table("registered_product_color_tag")
        .select("registered_product_id, slot")
        .eq("members_id", members_id)
        .in_("registered_product_id", product_ids)
        .execute()
    )
    out: dict[int, list[int]] = {}
    for row in resp.data or []:
        if not isinstance(row, dict):
            continue
        pid = row.get("registered_product_id")
        slot = row.get("slot")
        if isinstance(pid, int) and isinstance(slot, int):
            out.setdefault(pid, []).append(slot)
    for pid in out:
        out[pid] = sorted(set(out[pid]))
    return out
