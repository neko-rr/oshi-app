"""製品ユースケース。DB は infra 経由（RLS + members_id）。"""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)

FetchPage = Callable[..., list[dict[str, Any]]]
SignObject = Callable[..., str | None]


def normalize_product_row(row: dict[str, Any]) -> dict[str, Any]:
    """PostgREST 行を API レスポンス形へ正規化（署名前）。"""
    photo = row.get("photo")
    thumb: str | None = None
    if isinstance(photo, dict):
        raw = photo.get("photo_thumbnail_url")
        thumb = raw if isinstance(raw, str) and raw.strip() else None
    elif isinstance(photo, list) and photo:
        first = photo[0]
        if isinstance(first, dict):
            raw = first.get("photo_thumbnail_url")
            thumb = raw if isinstance(raw, str) and raw.strip() else None

    pid = row.get("photo_id")
    return {
        "registered_product_id": row.get("registered_product_id"),
        "product_name": row.get("product_name"),
        "photo_id": pid if isinstance(pid, int) else None,
        "photo_thumbnail_path": thumb,
        "photo_thumbnail_url": None,
        "creation_date": row.get("creation_date"),
        "category_tag_id": row.get("category_tag_id"),
        "storage_location_id": row.get("storage_location_id"),
        "category_tag": row.get("category_tag")
        if isinstance(row.get("category_tag"), dict)
        else None,
        "storage_location": row.get("storage_location")
        if isinstance(row.get("storage_location"), dict)
        else None,
        "color_tag_slots": [],
    }


def list_products_for_member(
    members_id: str,
    *,
    access_token: str,
    limit: int = 48,
    offset: int = 0,
    fetch_page: FetchPage | None = None,
    sign_object: SignObject | None = None,
) -> list[dict[str, Any]]:
    """ユーザー所有の製品一覧。

    fetch_page 未指定時は Supabase（ユーザー JWT）へ問い合わせる。
    サムネイル path があれば signed URL を付与（失敗時は url=null、一覧自体は返す）。
    """
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")

    fetcher = fetch_page
    if fetcher is None:
        from app.infra.supabase_user import fetch_products_page

        fetcher = fetch_products_page

    try:
        rows = fetcher(
            members_id=str(members_id).strip(),
            access_token=str(access_token).strip(),
            limit=limit,
            offset=offset,
        )
    except RuntimeError as exc:
        logger.warning("製品一覧を取得できません: %s", exc)
        return []
    except Exception:
        logger.exception("製品一覧の取得でシステムエラー")
        raise

    if not isinstance(rows, list):
        return []

    items = [normalize_product_row(r) for r in rows if isinstance(r, dict)]

    signer = sign_object
    if signer is None:
        from app.infra.photo_signing import create_signed_url_for_object

        signer = create_signed_url_for_object

    token = str(access_token).strip()
    for item in items:
        path = item.get("photo_thumbnail_path")
        if isinstance(path, str) and path.strip():
            try:
                item["photo_thumbnail_url"] = signer(
                    object_path=path.lstrip("/"),
                    access_token=token,
                    expires_in=3600,
                )
            except Exception:
                logger.exception("サムネイル署名に失敗")
                item["photo_thumbnail_url"] = None
    # カラースロット一括付与
    ids = [
        int(i["registered_product_id"])
        for i in items
        if isinstance(i.get("registered_product_id"), int)
    ]
    if ids:
        try:
            from app.services.product_color_tag_service import (
                get_color_slots_for_products,
            )

            slots_map = get_color_slots_for_products(
                members_id=str(members_id).strip(),
                access_token=token,
                product_ids=ids,
            )
            for item in items:
                pid = item.get("registered_product_id")
                if isinstance(pid, int):
                    item["color_tag_slots"] = slots_map.get(pid, [])
        except Exception:
            logger.exception("カラースロット取得に失敗")
    return items


def create_product_for_member(
    members_id: str,
    *,
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
    color_tag_slots: list[int] | None = None,
    insert_product: Callable[..., int] | None = None,
) -> dict[str, Any]:
    """製品を1件登録（IO / 楽天なし）。製品名必須。"""
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")
    name = (product_name or "").strip()
    if not name:
        raise ValueError("製品名は必須です")

    inserter = insert_product
    if inserter is None:
        from app.infra.supabase_user import insert_product_row

        inserter = insert_product_row

    try:
        new_id = inserter(
            members_id=str(members_id).strip(),
            access_token=str(access_token).strip(),
            product_name=name,
            photo_id=photo_id,
            barcode_number=(barcode_number or "").strip() or None,
            barcode_type=(barcode_type or "").strip() or "UNKNOWN",
            product_group_name=(product_group_name or "").strip() or None,
            works_series_name=(works_series_name or "").strip() or None,
            title=(title or "").strip() or None,
            character_name=(character_name or "").strip() or None,
            purchase_price=purchase_price,
            purchase_location=(purchase_location or "").strip() or None,
            memo=(memo or "").strip() or None,
            category_tag_id=category_tag_id,
            storage_location_id=storage_location_id,
        )
    except RuntimeError as exc:
        if str(exc) == "supabase_not_configured":
            raise ValueError(
                "Supabase が未設定です（API の SUPABASE_URL / PUBLISHABLE_KEY）"
            ) from exc
        logger.exception("製品登録に失敗")
        raise
    except Exception:
        logger.exception("製品登録でシステムエラー")
        raise

    if not isinstance(new_id, int) or new_id <= 0:
        raise RuntimeError("製品登録に失敗しました")

    if color_tag_slots is not None:
        from app.services.product_color_tag_service import set_product_color_slots

        set_product_color_slots(
            members_id=str(members_id).strip(),
            access_token=str(access_token).strip(),
            registered_product_id=new_id,
            slots=color_tag_slots,
        )

    return {
        "registered_product_id": new_id,
        "product_name": name,
        "photo_id": photo_id,
    }


def patch_product_for_member(
    members_id: str,
    *,
    access_token: str,
    registered_product_id: int,
    fields: dict[str, Any],
    color_tag_slots: list[int] | None = None,
) -> dict[str, Any] | None:
    """製品更新。存在しなければ None。"""
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    existing = get_product_for_member(
        members_id,
        access_token=access_token,
        registered_product_id=registered_product_id,
    )
    if existing is None:
        return None
    from app.infra.supabase_user import patch_product_row

    if fields:
        patch_product_row(
            members_id=str(members_id).strip(),
            access_token=str(access_token).strip(),
            registered_product_id=registered_product_id,
            fields=fields,
        )
    if color_tag_slots is not None:
        from app.services.product_color_tag_service import set_product_color_slots

        set_product_color_slots(
            members_id=str(members_id).strip(),
            access_token=str(access_token).strip(),
            registered_product_id=registered_product_id,
            slots=color_tag_slots,
        )
    return get_product_for_member(
        members_id,
        access_token=access_token,
        registered_product_id=registered_product_id,
    )


def delete_product_for_member(
    members_id: str,
    *,
    access_token: str,
    registered_product_id: int,
) -> bool:
    existing = get_product_for_member(
        members_id,
        access_token=access_token,
        registered_product_id=registered_product_id,
    )
    if existing is None:
        return False
    from app.infra.supabase_user import delete_product_row

    delete_product_row(
        members_id=str(members_id).strip(),
        access_token=str(access_token).strip(),
        registered_product_id=registered_product_id,
    )
    return True



def normalize_product_detail(row: dict[str, Any]) -> dict[str, Any]:
    """詳細用正規化（署名前）。"""
    photo = row.get("photo")
    thumb: str | None = None
    high: str | None = None
    if isinstance(photo, dict):
        t = photo.get("photo_thumbnail_url")
        h = photo.get("photo_high_resolution_url")
        thumb = t if isinstance(t, str) and t.strip() else None
        high = h if isinstance(h, str) and h.strip() else None
    elif isinstance(photo, list) and photo and isinstance(photo[0], dict):
        t = photo[0].get("photo_thumbnail_url")
        h = photo[0].get("photo_high_resolution_url")
        thumb = t if isinstance(t, str) and t.strip() else None
        high = h if isinstance(h, str) and h.strip() else None

    pid = row.get("photo_id")
    return {
        "registered_product_id": row.get("registered_product_id"),
        "product_name": row.get("product_name"),
        "photo_id": pid if isinstance(pid, int) else None,
        "photo_thumbnail_path": thumb,
        "photo_thumbnail_url": None,
        "photo_high_resolution_path": high,
        "photo_high_resolution_url": None,
        "creation_date": row.get("creation_date"),
        "memo": row.get("memo"),
        "barcode_number": row.get("barcode_number"),
        "barcode_type": row.get("barcode_type"),
        "product_group_name": row.get("product_group_name"),
        "works_series_name": row.get("works_series_name"),
        "title": row.get("title"),
        "character_name": row.get("character_name"),
        "purchase_price": row.get("purchase_price"),
        "purchase_location": row.get("purchase_location"),
        "category_tag_id": row.get("category_tag_id"),
        "storage_location_id": row.get("storage_location_id"),
        "category_tag": row.get("category_tag")
        if isinstance(row.get("category_tag"), dict)
        else None,
        "storage_location": row.get("storage_location")
        if isinstance(row.get("storage_location"), dict)
        else None,
        "color_tag_slots": [],
    }


def get_product_for_member(
    members_id: str,
    *,
    access_token: str,
    registered_product_id: int,
    fetch_one: Callable[..., dict[str, Any] | None] | None = None,
    sign_object: SignObject | None = None,
) -> dict[str, Any] | None:
    """1件詳細。無ければ None。"""
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")
    if not isinstance(registered_product_id, int) or registered_product_id <= 0:
        raise ValueError("registered_product_id が不正です")

    fetcher = fetch_one
    if fetcher is None:
        from app.infra.supabase_user import fetch_product_by_id

        fetcher = fetch_product_by_id

    try:
        row = fetcher(
            members_id=str(members_id).strip(),
            access_token=str(access_token).strip(),
            registered_product_id=registered_product_id,
        )
    except RuntimeError as exc:
        logger.warning("製品詳細を取得できません: %s", exc)
        return None
    except Exception:
        logger.exception("製品詳細の取得でシステムエラー")
        raise

    if not isinstance(row, dict):
        return None

    detail = normalize_product_detail(row)
    signer = sign_object
    if signer is None:
        from app.infra.photo_signing import create_signed_url_for_object

        signer = create_signed_url_for_object
    token = str(access_token).strip()
    for path_key, url_key in (
        ("photo_thumbnail_path", "photo_thumbnail_url"),
        ("photo_high_resolution_path", "photo_high_resolution_url"),
    ):
        path = detail.get(path_key)
        if isinstance(path, str) and path.strip():
            try:
                detail[url_key] = signer(
                    object_path=path.lstrip("/"),
                    access_token=token,
                    expires_in=3600,
                )
            except Exception:
                detail[url_key] = None
    try:
        from app.services.product_color_tag_service import get_color_slots_for_products

        slots_map = get_color_slots_for_products(
            members_id=str(members_id).strip(),
            access_token=token,
            product_ids=[registered_product_id],
        )
        detail["color_tag_slots"] = slots_map.get(registered_product_id, [])
    except Exception:
        detail["color_tag_slots"] = []
    return detail
