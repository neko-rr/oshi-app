"""カラータグ・カテゴリ・収納場所（ユーザー別マスター）。"""

from __future__ import annotations

import logging
import re
from typing import Any

from app.infra.supabase_user import create_user_client
from app.services.lucide_icon_catalog import (
    DEFAULT_CATEGORY_TAGS,
    DEFAULT_STORAGE_LOCATIONS,
    normalize_category_icon,
    normalize_storage_icon,
)

logger = logging.getLogger(__name__)

DEFAULT_COLOR_TAGS = [
    {"slot": 1, "color_tag_name": "赤", "color_tag_color": "#dc3545"},
    {"slot": 2, "color_tag_name": "青", "color_tag_color": "#0d6efd"},
    {"slot": 3, "color_tag_name": "緑", "color_tag_color": "#198754"},
    {"slot": 4, "color_tag_name": "黄", "color_tag_color": "#ffc107"},
    {"slot": 5, "color_tag_name": "紫", "color_tag_color": "#6f42c1"},
    {"slot": 6, "color_tag_name": "黒", "color_tag_color": "#212529"},
    {"slot": 7, "color_tag_name": "白", "color_tag_color": "#f8f9fa"},
]

DEFAULT_RECEIPT_LOCATIONS = DEFAULT_STORAGE_LOCATIONS

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
PRESET_SLOT_MIN = 1
PRESET_SLOT_MAX = 6


def is_preset_slot(slot: int | None) -> bool:
    if slot is None:
        return False
    return PRESET_SLOT_MIN <= int(slot) <= PRESET_SLOT_MAX


def validate_reorder_ids(existing_ids: list[int], ordered_ids: list[int]) -> None:
    """並び替え ID 一覧が現在のマスタと一致するか検証。"""
    if len(ordered_ids) != len(existing_ids):
        raise ValueError("件数が一致しません")
    if len(set(ordered_ids)) != len(ordered_ids):
        raise ValueError("ID が重複しています")
    existing_set = set(existing_ids)
    for tag_id in ordered_ids:
        if tag_id not in existing_set:
            raise ValueError("存在しない ID が含まれています")


def build_display_order_updates(ordered_ids: list[int]) -> list[tuple[int, int]]:
    """category_tag_id / storage_location_id → display_order（1 始まり）。"""
    return [(int(tag_id), index + 1) for index, tag_id in enumerate(ordered_ids)]


def _get_dismissed_preset_slots(
    client: Any,
    *,
    table: str,
    members_id: str,
) -> set[int]:
    resp = (
        client.table(table)
        .select("slot")
        .eq("members_id", members_id)
        .execute()
    )
    rows = resp.data or []
    out: set[int] = set()
    for row in rows:
        if not isinstance(row, dict):
            continue
        slot = row.get("slot")
        if slot is not None and is_preset_slot(int(slot)):
            out.add(int(slot))
    return out


def _record_preset_dismissed(
    client: Any,
    *,
    table: str,
    members_id: str,
    slot: int,
) -> None:
    client.table(table).upsert(
        {"members_id": members_id, "slot": slot},
        on_conflict="members_id,slot",
    ).execute()


def _clear_preset_dismissed(
    client: Any,
    *,
    table: str,
    members_id: str,
    slot: int,
) -> None:
    client.table(table).delete().eq("members_id", members_id).eq("slot", slot).execute()


def list_color_tags(*, members_id: str, access_token: str) -> list[dict[str, Any]]:
    client = create_user_client(access_token)
    resp = (
        client.table("color_tag")
        .select("*")
        .eq("members_id", members_id)
        .order("slot")
        .execute()
    )
    existing = resp.data or []
    filled = {int(i.get("slot")) for i in existing if i.get("slot") is not None}
    missing = [
        {**dc, "members_id": members_id}
        for dc in DEFAULT_COLOR_TAGS
        if dc["slot"] not in filled
    ]
    if missing:
        client.table("color_tag").upsert(
            missing, on_conflict="members_id,slot"
        ).execute()
        resp = (
            client.table("color_tag")
            .select("*")
            .eq("members_id", members_id)
            .order("slot")
            .execute()
        )
        existing = resp.data or []
    return sorted(existing, key=lambda x: int(x.get("slot") or 0))


def save_color_tags(
    *,
    members_id: str,
    access_token: str,
    entries: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if len(entries) != 7:
        raise ValueError("カラータグは7件必要です")
    payload = []
    for e in entries:
        slot = int(e["slot"])
        if slot < 1 or slot > 7:
            raise ValueError("slot は 1..7 です")
        color = (e.get("color_tag_color") or "").strip()
        if not HEX_RE.match(color):
            raise ValueError("色は #RRGGBB 形式です")
        payload.append(
            {
                "members_id": members_id,
                "slot": slot,
                "color_tag_name": (e.get("color_tag_name") or "").strip() or f"色{slot}",
                "color_tag_color": color,
            }
        )
    client = create_user_client(access_token)
    client.table("color_tag").upsert(payload, on_conflict="members_id,slot").execute()
    return list_color_tags(members_id=members_id, access_token=access_token)


def list_category_tags(
    *, members_id: str, access_token: str
) -> tuple[list[dict[str, Any]], list[int]]:
    client = create_user_client(access_token)
    dismissed = _get_dismissed_preset_slots(
        client,
        table="category_tag_preset_slot_dismissed",
        members_id=members_id,
    )
    resp = (
        client.table("category_tag")
        .select("*")
        .eq("members_id", members_id)
        .order("display_order")
        .execute()
    )
    existing = list(resp.data or [])
    filled = {int(i.get("slot")) for i in existing if i.get("slot") is not None}
    missing = []
    for i, dc in enumerate(DEFAULT_CATEGORY_TAGS):
        slot = int(dc["slot"])
        if slot in dismissed:
            continue
        if slot not in filled:
            missing.append(
                {
                    **dc,
                    "members_id": members_id,
                    "display_order": i + 1,
                    "category_tag_use_flag": 1,
                }
            )
    if missing:
        client.table("category_tag").insert(missing).execute()
        resp = (
            client.table("category_tag")
            .select("*")
            .eq("members_id", members_id)
            .order("display_order")
            .execute()
        )
        existing = list(resp.data or [])
    items = sorted(
        existing,
        key=lambda x: (int(x.get("display_order") or 0), int(x.get("category_tag_id") or 0)),
    )
    return items, sorted(dismissed)


def create_category_tag(
    *,
    members_id: str,
    access_token: str,
    name: str,
    color: str,
    icon: str,
) -> dict[str, Any]:
    name = name.strip()
    if not name:
        raise ValueError("カテゴリ名は必須です")
    color = color.strip() or "#6c757d"
    if not HEX_RE.match(color):
        raise ValueError("色は #RRGGBB 形式です")
    client = create_user_client(access_token)
    rows, _ = list_category_tags(members_id=members_id, access_token=access_token)
    max_order = max((int(r.get("display_order") or 0) for r in rows), default=0)
    payload = {
        "members_id": members_id,
        "category_tag_name": name,
        "category_tag_color": color,
        "category_tag_icon": normalize_category_icon(icon),
        "display_order": max_order + 1,
        "category_tag_use_flag": 1,
    }
    resp = client.table("category_tag").insert(payload).execute()
    data = resp.data or []
    if not data:
        raise RuntimeError("カテゴリの作成に失敗しました")
    return data[0]


def update_category_tag(
    *,
    members_id: str,
    access_token: str,
    category_tag_id: int,
    name: str,
    color: str,
    icon: str,
) -> None:
    name = name.strip()
    if not name:
        raise ValueError("カテゴリ名は必須です")
    color = color.strip()
    if not HEX_RE.match(color):
        raise ValueError("色は #RRGGBB 形式です")
    client = create_user_client(access_token)
    client.table("category_tag").update(
        {
            "category_tag_name": name,
            "category_tag_color": color,
            "category_tag_icon": normalize_category_icon(icon),
        }
    ).eq("members_id", members_id).eq("category_tag_id", category_tag_id).execute()


def delete_category_tag(
    *,
    members_id: str,
    access_token: str,
    category_tag_id: int,
) -> None:
    client = create_user_client(access_token)
    lookup = (
        client.table("category_tag")
        .select("category_tag_id,slot")
        .eq("members_id", members_id)
        .eq("category_tag_id", category_tag_id)
        .limit(1)
        .execute()
    )
    rows = lookup.data or []
    if not rows:
        return
    row = rows[0]
    slot_raw = row.get("slot") if isinstance(row, dict) else None
    slot = int(slot_raw) if slot_raw is not None else None
    client.table("registered_product").update(
        {"category_tag_id": None}
    ).eq("members_id", members_id).eq("category_tag_id", category_tag_id).execute()
    if is_preset_slot(slot):
        _record_preset_dismissed(
            client,
            table="category_tag_preset_slot_dismissed",
            members_id=members_id,
            slot=int(slot),
        )
    client.table("category_tag").delete().eq("members_id", members_id).eq(
        "category_tag_id", category_tag_id
    ).execute()


def reorder_category_tags(
    *,
    members_id: str,
    access_token: str,
    ordered_ids: list[int],
) -> list[dict[str, Any]]:
    items, _ = list_category_tags(members_id=members_id, access_token=access_token)
    existing_ids = [
        int(r["category_tag_id"])
        for r in items
        if isinstance(r.get("category_tag_id"), int)
    ]
    validate_reorder_ids(existing_ids, ordered_ids)
    client = create_user_client(access_token)
    for tag_id, order in build_display_order_updates(ordered_ids):
        client.table("category_tag").update({"display_order": order}).eq(
            "members_id", members_id
        ).eq("category_tag_id", tag_id).execute()
    items, _ = list_category_tags(members_id=members_id, access_token=access_token)
    return items


def restore_category_preset(
    *,
    members_id: str,
    access_token: str,
    slot: int,
) -> dict[str, Any]:
    if not is_preset_slot(slot):
        raise ValueError("slot は 1..6 です")
    client = create_user_client(access_token)
    _clear_preset_dismissed(
        client,
        table="category_tag_preset_slot_dismissed",
        members_id=members_id,
        slot=slot,
    )
    items, _ = list_category_tags(members_id=members_id, access_token=access_token)
    for row in items:
        if int(row.get("slot") or -1) == slot:
            return {"slot": slot, "restored": True}
    return {"slot": slot, "restored": True}


def list_storage_locations(
    *, members_id: str, access_token: str
) -> tuple[list[dict[str, Any]], list[int]]:
    client = create_user_client(access_token)
    dismissed = _get_dismissed_preset_slots(
        client,
        table="storage_location_preset_slot_dismissed",
        members_id=members_id,
    )
    resp = (
        client.table("storage_location")
        .select("*")
        .eq("members_id", members_id)
        .order("display_order")
        .execute()
    )
    existing = list(resp.data or [])
    filled = {int(i.get("slot")) for i in existing if i.get("slot") is not None}
    missing = []
    for i, dc in enumerate(DEFAULT_RECEIPT_LOCATIONS):
        slot = int(dc["slot"])
        if slot in dismissed:
            continue
        if slot not in filled:
            missing.append(
                {
                    **dc,
                    "members_id": members_id,
                    "display_order": i + 1,
                    "storage_location_use_flag": 1,
                }
            )
    if missing:
        client.table("storage_location").insert(missing).execute()
        resp = (
            client.table("storage_location")
            .select("*")
            .eq("members_id", members_id)
            .order("display_order")
            .execute()
        )
        existing = list(resp.data or [])
    items = sorted(
        existing,
        key=lambda x: (
            int(x.get("display_order") or 0),
            int(x.get("storage_location_id") or 0),
        ),
    )
    return items, sorted(dismissed)


def create_storage_location(
    *,
    members_id: str,
    access_token: str,
    name: str,
    icon: str,
) -> dict[str, Any]:
    name = name.strip()
    if not name:
        raise ValueError("収納場所名は必須です")
    client = create_user_client(access_token)
    rows, _ = list_storage_locations(members_id=members_id, access_token=access_token)
    max_order = max((int(r.get("display_order") or 0) for r in rows), default=0)
    payload = {
        "members_id": members_id,
        "storage_location_name": name,
        "storage_location_icon": normalize_storage_icon(icon),
        "display_order": max_order + 1,
        "storage_location_use_flag": 1,
    }
    resp = client.table("storage_location").insert(payload).execute()
    data = resp.data or []
    if not data:
        raise RuntimeError("収納場所の作成に失敗しました")
    return data[0]


def update_storage_location(
    *,
    members_id: str,
    access_token: str,
    storage_location_id: int,
    name: str,
    icon: str,
) -> None:
    name = name.strip()
    if not name:
        raise ValueError("収納場所名は必須です")
    client = create_user_client(access_token)
    client.table("storage_location").update(
        {
            "storage_location_name": name,
            "storage_location_icon": normalize_storage_icon(icon),
        }
    ).eq("members_id", members_id).eq(
        "storage_location_id", storage_location_id
    ).execute()


def delete_storage_location(
    *,
    members_id: str,
    access_token: str,
    storage_location_id: int,
) -> None:
    client = create_user_client(access_token)
    lookup = (
        client.table("storage_location")
        .select("storage_location_id,slot")
        .eq("members_id", members_id)
        .eq("storage_location_id", storage_location_id)
        .limit(1)
        .execute()
    )
    rows = lookup.data or []
    if not rows:
        return
    row = rows[0]
    slot_raw = row.get("slot") if isinstance(row, dict) else None
    slot = int(slot_raw) if slot_raw is not None else None
    client.table("registered_product").update(
        {"storage_location_id": None}
    ).eq("members_id", members_id).eq(
        "storage_location_id", storage_location_id
    ).execute()
    if is_preset_slot(slot):
        _record_preset_dismissed(
            client,
            table="storage_location_preset_slot_dismissed",
            members_id=members_id,
            slot=int(slot),
        )
    client.table("storage_location").delete().eq("members_id", members_id).eq(
        "storage_location_id", storage_location_id
    ).execute()


def reorder_storage_locations(
    *,
    members_id: str,
    access_token: str,
    ordered_ids: list[int],
) -> list[dict[str, Any]]:
    items, _ = list_storage_locations(members_id=members_id, access_token=access_token)
    existing_ids = [
        int(r["storage_location_id"])
        for r in items
        if isinstance(r.get("storage_location_id"), int)
    ]
    validate_reorder_ids(existing_ids, ordered_ids)
    client = create_user_client(access_token)
    for location_id, order in build_display_order_updates(ordered_ids):
        client.table("storage_location").update({"display_order": order}).eq(
            "members_id", members_id
        ).eq("storage_location_id", location_id).execute()
    items, _ = list_storage_locations(members_id=members_id, access_token=access_token)
    return items


def restore_storage_preset(
    *,
    members_id: str,
    access_token: str,
    slot: int,
) -> dict[str, Any]:
    if not is_preset_slot(slot):
        raise ValueError("slot は 1..6 です")
    client = create_user_client(access_token)
    _clear_preset_dismissed(
        client,
        table="storage_location_preset_slot_dismissed",
        members_id=members_id,
        slot=slot,
    )
    items, _ = list_storage_locations(members_id=members_id, access_token=access_token)
    for row in items:
        if int(row.get("slot") or -1) == slot:
            return {"slot": slot, "restored": True}
    return {"slot": slot, "restored": True}
