"""ユーザー JWT 付き Supabase クライアント（RLS 前提）。"""

from __future__ import annotations

import logging
from typing import Any

from app.core.settings import get_settings

logger = logging.getLogger(__name__)

_PRODUCT_LIST_SELECT = """
registered_product_id,
product_name,
barcode_number,
photo_id,
creation_date,
purchase_price,
currency_code,
category_tag_id,
storage_location_id,
photo(photo_thumbnail_url),
category_tag(category_tag_name,category_tag_color,category_tag_icon),
storage_location(storage_location_name,storage_location_icon)
""".replace(
    "\n", ""
)


def create_user_client(access_token: str) -> Any:
    """publishable key + Authorization Bearer でクライアント生成。

    未設定時は RuntimeError('supabase_not_configured')。
    """
    if not access_token or not access_token.strip():
        raise ValueError("access_token が空です")

    settings = get_settings()
    url = settings.supabase_url.strip().rstrip("/")
    key = settings.supabase_publishable_key.strip()
    if url.lower().endswith("/rest/v1"):
        url = url[: -len("/rest/v1")].rstrip("/")
    if not url or not key:
        raise RuntimeError("supabase_not_configured")

    try:
        from supabase import create_client
        # supabase 2.31+ は SyncClientOptions（storage 必須）。旧 ClientOptions だと 500 になる
        from supabase.lib.client_options import SyncClientOptions
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError("supabase_not_configured") from exc

    return create_client(
        url,
        key,
        options=SyncClientOptions(
            headers={"Authorization": f"Bearer {access_token.strip()}"}
        ),
    )


def _escape_ilike_fragment(raw: str) -> str:
    """PostgREST ilike 用に % _ , を緩和。"""
    return (
        raw.replace("\\", " ")
        .replace("%", " ")
        .replace("_", " ")
        .replace(",", " ")
        .replace(".", " ")
        .replace("(", " ")
        .replace(")", " ")
    )


def _resolve_tag_ids_matching_name(
    client: Any,
    *,
    table: str,
    id_column: str,
    name_column: str,
    members_id: str,
    needle: str,
) -> list[int]:
    pattern = f"%{_escape_ilike_fragment(needle)}%"
    try:
        resp = (
            client.table(table)
            .select(id_column)
            .eq("members_id", members_id)
            .ilike(name_column, pattern)
            .execute()
        )
    except Exception:
        logger.exception("タグ名検索に失敗: %s", table)
        return []
    data = resp.data if hasattr(resp, "data") else None
    if not isinstance(data, list):
        return []
    out: list[int] = []
    for row in data:
        if not isinstance(row, dict):
            continue
        raw_id = row.get(id_column)
        if isinstance(raw_id, int):
            out.append(raw_id)
        elif isinstance(raw_id, str) and raw_id.isdigit():
            out.append(int(raw_id))
    return out


def fetch_products_page(
    *,
    members_id: str,
    access_token: str,
    limit: int = 48,
    offset: int = 0,
    barcode_number: str | None = None,
    q: str | None = None,
    category_tag_ids: list[int] | None = None,
    storage_location_ids: list[int] | None = None,
    color_tag_slots: list[int] | None = None,
    sort: str | None = None,
) -> list[dict[str, Any]]:
    """registered_product を 1 ページ取得（RLS + eq members_id）。

    barcode_number 指定時は番号完全一致（購入済み判定用）。
    q は製品名・タグ名の部分一致を DB 側で OR。
    category / storage / color は同種 OR・異種 AND。
    sort: newest（登録日新しい順）/ name（名前）/ created_at（登録日古い順）。
    """
    if limit <= 0:
        return []
    client = create_user_client(access_token)
    end = offset + limit - 1

    cat_ids = [int(x) for x in (category_tag_ids or []) if int(x) >= 1]
    storage_ids_filter = [
        int(x) for x in (storage_location_ids or []) if int(x) >= 1
    ]
    color_slots = [
        int(x) for x in (color_tag_slots or []) if 1 <= int(x) <= 7
    ]

    # 色スロット: junction から product id を先に取得（ページング前）
    color_product_ids: list[int] | None = None
    if color_slots:
        color_resp = (
            client.table("registered_product_color_tag")
            .select("registered_product_id")
            .eq("members_id", members_id)
            .in_("slot", color_slots)
            .execute()
        )
        seen: set[int] = set()
        color_product_ids = []
        for row in color_resp.data or []:
            if not isinstance(row, dict):
                continue
            pid = row.get("registered_product_id")
            if isinstance(pid, int) and pid not in seen:
                seen.add(pid)
                color_product_ids.append(pid)
        if not color_product_ids:
            return []

    query = (
        client.table("registered_product")
        .select(_PRODUCT_LIST_SELECT)
        .eq("members_id", members_id)
    )
    code = (barcode_number or "").strip()
    if code:
        query = query.eq("barcode_number", code)
    if cat_ids:
        query = query.in_("category_tag_id", cat_ids)
    if storage_ids_filter:
        query = query.in_("storage_location_id", storage_ids_filter)
    if color_product_ids is not None:
        query = query.in_("registered_product_id", color_product_ids)

    needle = (q or "").strip()
    if needle:
        cat_ids_q = _resolve_tag_ids_matching_name(
            client,
            table="category_tag",
            id_column="category_tag_id",
            name_column="category_tag_name",
            members_id=members_id,
            needle=needle,
        )
        storage_ids = _resolve_tag_ids_matching_name(
            client,
            table="storage_location",
            id_column="storage_location_id",
            name_column="storage_location_name",
            members_id=members_id,
            needle=needle,
        )
        frag = _escape_ilike_fragment(needle)
        # PostgREST: ワイルドカード付きは二重引用符で囲む
        pattern = f"\"%{frag}%\""
        or_parts = [
            f"product_name.ilike.{pattern}",
            f"character_name.ilike.{pattern}",
            f"title.ilike.{pattern}",
            f"product_group_name.ilike.{pattern}",
            f"works_series_name.ilike.{pattern}",
        ]
        if cat_ids_q:
            ids_csv = ",".join(str(i) for i in cat_ids_q)
            or_parts.append(f"category_tag_id.in.({ids_csv})")
        if storage_ids:
            ids_csv = ",".join(str(i) for i in storage_ids)
            or_parts.append(f"storage_location_id.in.({ids_csv})")
        query = query.or_(",".join(or_parts))

    sort_key = (sort or "newest").strip()
    if sort_key == "name":
        order_column, order_desc = "product_name", False
    elif sort_key == "created_at":
        order_column, order_desc = "creation_date", False
    else:
        order_column, order_desc = "creation_date", True

    response = (
        query.order(order_column, desc=order_desc).range(offset, end).execute()
    )
    if getattr(response, "error", None):
        logger.exception("製品一覧の取得に失敗: %s", response.error)
        raise RuntimeError("製品一覧の取得に失敗しました")
    data = response.data if hasattr(response, "data") else None
    if not isinstance(data, list):
        return []
    return data

def insert_product_row(
    *,
    members_id: str,
    access_token: str,
    product_name: str,
    photo_id: int | None = None,
    barcode_number: str | None = None,
    barcode_type: str | None = None,
    product_group_name: str | None = None,
    works_series_name: str | None = None,
    title: str | None = None,
    character_name: str | None = None,
    purchase_price: int | None = None,
    currency_code: str | None = None,
    purchase_location: str | None = None,
    memo: str | None = None,
    category_tag_id: int | None = None,
    storage_location_id: int | None = None,
) -> int:
    """registered_product に1行 insert し ID を返す。"""
    client = create_user_client(access_token)
    payload: dict[str, Any] = {
        "members_id": members_id,
        "product_name": product_name,
        "product_group_name": product_group_name or "",
        "works_series_name": works_series_name or "",
        "title": title or "",
        "character_name": character_name or "",
        "barcode_number": barcode_number or "",
        "barcode_type": barcode_type or "UNKNOWN",
        "purchase_location": purchase_location or "",
        "memo": memo or "",
        "product_series_flag": 0,
        "product_series_complete_flag": 0,
        "commercial_product_flag": 1,
        "personal_product_flag": 0,
        "digital_product_flag": 0,
        "sales_desired_flag": 0,
        "want_object_flag": 0,
        "freebie_flag": 0,
    }
    if photo_id is not None:
        payload["photo_id"] = photo_id
    if purchase_price is not None:
        payload["purchase_price"] = purchase_price
    if currency_code is not None:
        payload["currency_code"] = currency_code
    if category_tag_id is not None:
        payload["category_tag_id"] = category_tag_id
    if storage_location_id is not None:
        payload["storage_location_id"] = storage_location_id

    response = (
        client.table("registered_product").insert(payload).execute()
    )
    if getattr(response, "error", None):
        logger.error("product insert error: %s", response.error)
        raise RuntimeError("製品レコードの挿入に失敗しました")
    data = response.data if hasattr(response, "data") else None
    if not data or not isinstance(data, list):
        raise RuntimeError("製品レコードの挿入に失敗しました")
    new_id = data[0].get("registered_product_id")
    if not isinstance(new_id, int):
        raise RuntimeError("製品レコードの挿入に失敗しました")
    return new_id


_PRODUCT_DETAIL_SELECT = """
registered_product_id,
product_name,
photo_id,
creation_date,
memo,
barcode_number,
barcode_type,
product_group_name,
works_series_name,
title,
character_name,
purchase_price,
currency_code,
purchase_location,
category_tag_id,
storage_location_id,
photo(photo_thumbnail_url,photo_high_resolution_url),
category_tag(category_tag_id,category_tag_name,category_tag_color,category_tag_icon),
storage_location(storage_location_id,storage_location_name,storage_location_icon)
""".replace(
    "\n", ""
)


def fetch_product_by_id(
    *,
    members_id: str,
    access_token: str,
    registered_product_id: int,
) -> dict[str, Any] | None:
    """members_id 一致の製品1件。無ければ None。"""
    client = create_user_client(access_token)
    response = (
        client.table("registered_product")
        .select(_PRODUCT_DETAIL_SELECT)
        .eq("members_id", members_id)
        .eq("registered_product_id", registered_product_id)
        .limit(1)
        .execute()
    )
    if getattr(response, "error", None):
        logger.exception("製品詳細の取得に失敗: %s", response.error)
        raise RuntimeError("製品詳細の取得に失敗しました")
    data = response.data if hasattr(response, "data") else None
    if not isinstance(data, list) or not data:
        return None
    row = data[0]
    return row if isinstance(row, dict) else None


def patch_product_row(
    *,
    members_id: str,
    access_token: str,
    registered_product_id: int,
    fields: dict[str, Any],
) -> None:
    if not fields:
        return
    client = create_user_client(access_token)
    client.table("registered_product").update(fields).eq(
        "members_id", members_id
    ).eq("registered_product_id", registered_product_id).execute()


def bulk_patch_product_storage(
    *,
    members_id: str,
    access_token: str,
    registered_product_ids: list[int],
    storage_location_id: int | None,
) -> None:
    """複数製品の storage_location_id を一括更新（null 可）。"""
    bulk_patch_product_fields(
        members_id=members_id,
        access_token=access_token,
        registered_product_ids=registered_product_ids,
        fields={"storage_location_id": storage_location_id},
    )


def bulk_patch_product_fields(
    *,
    members_id: str,
    access_token: str,
    registered_product_ids: list[int],
    fields: dict[str, Any],
) -> None:
    """複数製品のスカラー列を一括更新。"""
    if not registered_product_ids or not fields:
        return
    client = create_user_client(access_token)
    client.table("registered_product").update(fields).eq(
        "members_id", members_id
    ).in_("registered_product_id", registered_product_ids).execute()


def delete_product_row(
    *,
    members_id: str,
    access_token: str,
    registered_product_id: int,
) -> None:
    client = create_user_client(access_token)
    client.table("registered_product_color_tag").delete().eq(
        "members_id", members_id
    ).eq("registered_product_id", registered_product_id).execute()
    client.table("registered_product").delete().eq(
        "members_id", members_id
    ).eq("registered_product_id", registered_product_id).execute()
