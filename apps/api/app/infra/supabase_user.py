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
category_tag_id,
storage_location_id,
photo(photo_thumbnail_url),
category_tag(category_tag_name,category_tag_color),
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


def fetch_products_page(
    *,
    members_id: str,
    access_token: str,
    limit: int = 48,
    offset: int = 0,
    barcode_number: str | None = None,
) -> list[dict[str, Any]]:
    """registered_product を 1 ページ取得（RLS + eq members_id）。

    barcode_number 指定時は番号完全一致（購入済み判定用）。
    """
    if limit <= 0:
        return []
    client = create_user_client(access_token)
    end = offset + limit - 1
    query = (
        client.table("registered_product")
        .select(_PRODUCT_LIST_SELECT)
        .eq("members_id", members_id)
    )
    code = (barcode_number or "").strip()
    if code:
        query = query.eq("barcode_number", code)
    response = (
        query.order("creation_date", desc=True).range(offset, end).execute()
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
