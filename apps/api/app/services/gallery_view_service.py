"""ギャラリー保存済みビュー（gallery_view）。無料・上限 20。"""

from __future__ import annotations

import logging
from typing import Any

from app.infra.supabase_user import create_user_client

logger = logging.getLogger(__name__)

MAX_GALLERY_VIEWS = 20
MAX_VIEW_NAME_LEN = 40
ALLOWED_LIST_SORT = frozenset({"newest", "name", "created_at"})
MAX_COLOR_SLOT = 7

SELECT_COLS = (
    "gallery_view_id,view_name,q,category_tag_ids,storage_location_ids,"
    "color_tag_slots,list_sort,display_order,created_at,updated_at"
)


def _normalize_view_name(raw: str) -> str:
    name = (raw or "").strip()
    if not name:
        raise ValueError("ビュー名を入力してください")
    if len(name) > MAX_VIEW_NAME_LEN:
        raise ValueError(f"ビュー名は{MAX_VIEW_NAME_LEN}文字以内にしてください")
    return name


def _normalize_q(raw: str | None) -> str | None:
    if raw is None:
        return None
    q = str(raw).strip()
    return q or None


def _normalize_id_list(raw: list[int] | None, *, field: str) -> list[int]:
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise ValueError(f"未対応の値です（{field}）")
    out: list[int] = []
    seen: set[int] = set()
    for item in raw:
        try:
            n = int(item)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"未対応の値です（{field}）") from exc
        if n < 1:
            raise ValueError(f"未対応の値です（{field}）")
        if n in seen:
            continue
        seen.add(n)
        out.append(n)
    return out


def _normalize_color_slots(raw: list[int] | None) -> list[int]:
    ids = _normalize_id_list(raw, field="color_tag_slots")
    for n in ids:
        if n > MAX_COLOR_SLOT:
            raise ValueError("未対応の色スロットです")
    return ids


def _normalize_list_sort(raw: str | None) -> str:
    value = (raw or "newest").strip()
    if value not in ALLOWED_LIST_SORT:
        raise ValueError("未対応の並びです")
    return value


def _row_to_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "gallery_view_id": int(row["gallery_view_id"]),
        "view_name": str(row.get("view_name") or ""),
        "q": row.get("q"),
        "category_tag_ids": list(row.get("category_tag_ids") or []),
        "storage_location_ids": list(row.get("storage_location_ids") or []),
        "color_tag_slots": list(row.get("color_tag_slots") or []),
        "list_sort": str(row.get("list_sort") or "newest"),
        "display_order": int(row.get("display_order") or 0),
    }


def list_gallery_views(*, members_id: str, access_token: str) -> list[dict[str, Any]]:
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")
    client = create_user_client(str(access_token).strip())
    resp = (
        client.table("gallery_view")
        .select(SELECT_COLS)
        .eq("members_id", str(members_id).strip())
        .order("display_order")
        .order("gallery_view_id")
        .execute()
    )
    items: list[dict[str, Any]] = []
    for row in resp.data or []:
        if isinstance(row, dict):
            items.append(_row_to_item(row))
    return items


def create_gallery_view(
    *,
    members_id: str,
    access_token: str,
    view_name: str,
    q: str | None = None,
    category_tag_ids: list[int] | None = None,
    storage_location_ids: list[int] | None = None,
    color_tag_slots: list[int] | None = None,
    list_sort: str | None = None,
) -> dict[str, Any]:
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")

    name = _normalize_view_name(view_name)
    mid = str(members_id).strip()
    token = str(access_token).strip()
    client = create_user_client(token)

    count_resp = (
        client.table("gallery_view")
        .select("gallery_view_id", count="exact")
        .eq("members_id", mid)
        .execute()
    )
    current = int(count_resp.count or 0) if count_resp.count is not None else len(
        count_resp.data or []
    )
    if current >= MAX_GALLERY_VIEWS:
        raise ValueError(f"保存できるビューは{MAX_GALLERY_VIEWS}件までです")

    payload = {
        "members_id": mid,
        "view_name": name,
        "q": _normalize_q(q),
        "category_tag_ids": _normalize_id_list(
            category_tag_ids, field="category_tag_ids"
        ),
        "storage_location_ids": _normalize_id_list(
            storage_location_ids, field="storage_location_ids"
        ),
        "color_tag_slots": _normalize_color_slots(color_tag_slots),
        "list_sort": _normalize_list_sort(list_sort),
        "display_order": 0,
    }
    try:
        resp = (
            client.table("gallery_view")
            .insert(payload)
            .select(SELECT_COLS)
            .single()
            .execute()
        )
    except Exception as exc:
        msg = str(exc).lower()
        if "unique" in msg or "duplicate" in msg:
            raise ValueError("同じ名前のビューがすでにあります") from exc
        logger.exception("gallery_view insert failed")
        raise

    row = resp.data
    if not isinstance(row, dict):
        raise RuntimeError("gallery_view_insert_failed")
    return _row_to_item(row)


def rename_gallery_view(
    *,
    members_id: str,
    access_token: str,
    gallery_view_id: int,
    view_name: str,
) -> dict[str, Any]:
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")
    try:
        vid = int(gallery_view_id)
    except (TypeError, ValueError) as exc:
        raise ValueError("未対応のビュー ID です") from exc
    if vid < 1:
        raise ValueError("未対応のビュー ID です")

    name = _normalize_view_name(view_name)
    mid = str(members_id).strip()
    client = create_user_client(str(access_token).strip())
    try:
        resp = (
            client.table("gallery_view")
            .update({"view_name": name})
            .eq("members_id", mid)
            .eq("gallery_view_id", vid)
            .select(SELECT_COLS)
            .maybe_single()
            .execute()
        )
    except Exception as exc:
        msg = str(exc).lower()
        if "unique" in msg or "duplicate" in msg:
            raise ValueError("同じ名前のビューがすでにあります") from exc
        logger.exception("gallery_view rename failed")
        raise

    row = resp.data
    if not isinstance(row, dict):
        raise ValueError("ビューが見つかりません")
    return _row_to_item(row)


def delete_gallery_view(
    *,
    members_id: str,
    access_token: str,
    gallery_view_id: int,
) -> bool:
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")
    try:
        vid = int(gallery_view_id)
    except (TypeError, ValueError) as exc:
        raise ValueError("未対応のビュー ID です") from exc
    if vid < 1:
        raise ValueError("未対応のビュー ID です")

    mid = str(members_id).strip()
    client = create_user_client(str(access_token).strip())
    existing = (
        client.table("gallery_view")
        .select("gallery_view_id")
        .eq("members_id", mid)
        .eq("gallery_view_id", vid)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise ValueError("ビューが見つかりません")
    (
        client.table("gallery_view")
        .delete()
        .eq("members_id", mid)
        .eq("gallery_view_id", vid)
        .execute()
    )
    return True
