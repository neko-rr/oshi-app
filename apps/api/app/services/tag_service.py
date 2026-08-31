"""カラータグ・カテゴリ・収納場所（ユーザー別マスター）。"""

from __future__ import annotations

import logging
import re
from typing import Any

from app.infra.supabase_user import create_user_client

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

DEFAULT_RECEIPT_LOCATIONS = [
    {"slot": 1, "storage_location_name": "タンス", "storage_location_icon": "bi-archive"},
    {"slot": 2, "storage_location_name": "棚", "storage_location_icon": "bi-bookshelf"},
    {"slot": 3, "storage_location_name": "ケース", "storage_location_icon": "bi-box"},
    {"slot": 4, "storage_location_name": "壁", "storage_location_icon": "bi-border"},
    {"slot": 5, "storage_location_name": "机", "storage_location_icon": "bi-laptop"},
    {"slot": 6, "storage_location_name": "その他", "storage_location_icon": "bi-three-dots"},
]

DEFAULT_CATEGORY_TAGS = [
    {"slot": 1, "category_tag_name": "アクリル", "category_tag_color": "#0d6efd", "category_tag_icon": "bi-square"},
    {"slot": 2, "category_tag_name": "缶バッジ", "category_tag_color": "#dc3545", "category_tag_icon": "bi-circle"},
    {"slot": 3, "category_tag_name": "フィギュア", "category_tag_color": "#198754", "category_tag_icon": "bi-person"},
    {"slot": 4, "category_tag_name": "紙類", "category_tag_color": "#ffc107", "category_tag_icon": "bi-file-earmark"},
    {"slot": 5, "category_tag_name": "ぬいぐるみ", "category_tag_color": "#6f42c1", "category_tag_icon": "bi-heart"},
    {"slot": 6, "category_tag_name": "その他", "category_tag_color": "#6c757d", "category_tag_icon": "bi-three-dots"},
]

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


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


def list_category_tags(*, members_id: str, access_token: str) -> list[dict[str, Any]]:
    client = create_user_client(access_token)
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
        if dc["slot"] not in filled:
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
    return sorted(
        existing,
        key=lambda x: (int(x.get("display_order") or 0), int(x.get("category_tag_id") or 0)),
    )


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
    rows = list_category_tags(members_id=members_id, access_token=access_token)
    max_order = max((int(r.get("display_order") or 0) for r in rows), default=0)
    payload = {
        "members_id": members_id,
        "category_tag_name": name,
        "category_tag_color": color,
        "category_tag_icon": (icon or "bi-tag").strip(),
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
            "category_tag_icon": (icon or "bi-tag").strip(),
        }
    ).eq("members_id", members_id).eq("category_tag_id", category_tag_id).execute()


def delete_category_tag(
    *,
    members_id: str,
    access_token: str,
    category_tag_id: int,
) -> None:
    client = create_user_client(access_token)
    client.table("registered_product").update(
        {"category_tag_id": None}
    ).eq("members_id", members_id).eq("category_tag_id", category_tag_id).execute()
    client.table("category_tag").delete().eq("members_id", members_id).eq(
        "category_tag_id", category_tag_id
    ).execute()


def list_storage_locations(*, members_id: str, access_token: str) -> list[dict[str, Any]]:
    client = create_user_client(access_token)
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
        if dc["slot"] not in filled:
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
    return sorted(
        existing,
        key=lambda x: (
            int(x.get("display_order") or 0),
            int(x.get("storage_location_id") or 0),
        ),
    )


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
    rows = list_storage_locations(members_id=members_id, access_token=access_token)
    max_order = max((int(r.get("display_order") or 0) for r in rows), default=0)
    payload = {
        "members_id": members_id,
        "storage_location_name": name,
        "storage_location_icon": (icon or "bi-geo").strip(),
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
            "storage_location_icon": (icon or "bi-geo").strip(),
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
    client.table("registered_product").update(
        {"storage_location_id": None}
    ).eq("members_id", members_id).eq(
        "storage_location_id", storage_location_id
    ).execute()
    client.table("storage_location").delete().eq("members_id", members_id).eq(
        "storage_location_id", storage_location_id
    ).execute()
