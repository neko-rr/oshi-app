"""製品ユースケース。DB は infra 経由（RLS + members_id）。"""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from app.services.currency_codes import normalize_currency_code

logger = logging.getLogger(__name__)

FetchPage = Callable[..., list[dict[str, Any]]]
SignObject = Callable[..., str | None]


def _tag_summary_from_embed(
    embed: dict[str, Any] | None,
    *,
    name_key: str,
    color_key: str | None = None,
    icon_key: str | None = None,
) -> dict[str, Any] | None:
    if not isinstance(embed, dict):
        return None
    name = embed.get(name_key)
    if not isinstance(name, str) or not name.strip():
        return None
    out: dict[str, Any] = {"name": name.strip()}
    if color_key:
        color = embed.get(color_key)
        if isinstance(color, str) and color.strip():
            out["color"] = color.strip()
    if icon_key:
        icon = embed.get(icon_key)
        if isinstance(icon, str) and icon.strip():
            out["icon"] = icon.strip()
    return out


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
    raw_barcode = row.get("barcode_number")
    if isinstance(raw_barcode, str):
        barcode_number = raw_barcode.strip() or None
    elif raw_barcode is None:
        barcode_number = None
    else:
        barcode_number = str(raw_barcode)

    return {
        "registered_product_id": row.get("registered_product_id"),
        "product_name": row.get("product_name"),
        "barcode_number": barcode_number,
        "photo_id": pid if isinstance(pid, int) else None,
        "photo_thumbnail_path": thumb,
        "photo_thumbnail_url": None,
        "creation_date": row.get("creation_date"),
        "category_tag_id": row.get("category_tag_id"),
        "storage_location_id": row.get("storage_location_id"),
        "purchase_price": row.get("purchase_price"),
        "currency_code": row.get("currency_code"),
        "category_tag": _tag_summary_from_embed(
            row.get("category_tag") if isinstance(row.get("category_tag"), dict) else None,
            name_key="category_tag_name",
            color_key="category_tag_color",
            icon_key="category_tag_icon",
        ),
        "storage_location": _tag_summary_from_embed(
            row.get("storage_location")
            if isinstance(row.get("storage_location"), dict)
            else None,
            name_key="storage_location_name",
            icon_key="storage_location_icon",
        ),
        "color_tag_slots": [],
    }


def filter_products_by_query(
    items: list[dict[str, Any]],
    q: str | None,
) -> list[dict[str, Any]]:
    """製品名・カテゴリ・収納場所の部分一致（大小無視）。空クエリは無変更。"""
    needle = (q or "").strip().casefold()
    if not needle:
        return items
    matched: list[dict[str, Any]] = []
    for item in items:
        name = str(item.get("product_name") or "").casefold()
        cat = item.get("category_tag")
        cat_name = ""
        if isinstance(cat, dict):
            cat_name = str(cat.get("name") or cat.get("category_tag_name") or "").casefold()
        storage = item.get("storage_location")
        storage_name = ""
        if isinstance(storage, dict):
            storage_name = str(
                storage.get("name") or storage.get("storage_location_name") or ""
            ).casefold()
        blob = f"{name} {cat_name} {storage_name}"
        if needle in blob:
            matched.append(item)
    return matched


def filter_products_by_barcode(
    items: list[dict[str, Any]],
    barcode: str | None,
) -> list[dict[str, Any]]:
    """barcode_number の完全一致。空なら無変更。購入済み判定の土台。"""
    code = (barcode or "").strip()
    if not code:
        return items
    return [
        item
        for item in items
        if str(item.get("barcode_number") or "").strip() == code
    ]


def list_products_for_member(
    members_id: str,
    *,
    access_token: str,
    limit: int = 48,
    offset: int = 0,
    q: str | None = None,
    barcode: str | None = None,
    category_tag_ids: list[int] | None = None,
    storage_location_ids: list[int] | None = None,
    color_tag_slots: list[int] | None = None,
    sort: str | None = None,
    fetch_page: FetchPage | None = None,
    sign_object: SignObject | None = None,
) -> list[dict[str, Any]]:
    """ユーザー所有の製品一覧。

    fetch_page 未指定時は Supabase（ユーザー JWT）へ問い合わせる。
    サムネイル path があれば signed URL を付与（失敗時は url=null、一覧自体は返す）。
    q / タグ ID は fetch（DB）側で絞り込み、その後に limit/offset。
    barcode 指定時は番号完全一致（DB 側フィルタ＋防御的再フィルタ）。
    sort: newest / name / created_at。
    """
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")

    barcode_norm = (barcode or "").strip() or None
    q_norm = (q or "").strip() or None
    sort_norm = (sort or "newest").strip() or "newest"
    if sort_norm not in {"newest", "name", "created_at"}:
        raise ValueError("未対応の並び順です")

    cat_ids = list(category_tag_ids or [])
    storage_ids = list(storage_location_ids or [])
    color_slots = list(color_tag_slots or [])

    fetcher = fetch_page
    if fetcher is None:
        from app.infra.supabase_user import fetch_products_page

        fetcher = fetch_products_page

    mid = str(members_id).strip()
    token = str(access_token).strip()
    q_applied_in_fetch = False
    try:
        rows = fetcher(
            members_id=mid,
            access_token=token,
            limit=limit,
            offset=offset,
            barcode_number=barcode_norm,
            q=q_norm,
            category_tag_ids=cat_ids or None,
            storage_location_ids=storage_ids or None,
            color_tag_slots=color_slots or None,
            sort=sort_norm,
        )
        q_applied_in_fetch = True
    except TypeError:
        # 古い fetch 差し替え用（新引数未対応）
        try:
            rows = fetcher(
                members_id=mid,
                access_token=token,
                limit=limit,
                offset=offset,
                barcode_number=barcode_norm,
            )
        except TypeError:
            rows = fetcher(
                members_id=mid,
                access_token=token,
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
    items = filter_products_by_barcode(items, barcode_norm)
    # 旧 fetch 互換時のみメモリ側で q フォールバック
    if q_norm and not q_applied_in_fetch:
        items = filter_products_by_query(items, q_norm)

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
    currency_code: str | None = None,
    purchase_location: str | None = None,
    memo: str | None = None,
    category_tag_id: int | None = None,
    storage_location_id: int | None = None,
    color_tag_slots: list[int] | None = None,
    insert_product: Callable[..., int] | None = None,
    record_storage_pick: Callable[..., None] | None = None,
) -> dict[str, Any]:
    """製品を1件登録（IO / 楽天なし）。製品名必須。"""
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")
    name = (product_name or "").strip()
    if not name:
        raise ValueError("製品名は必須です")

    # 価格なしでは記録通貨を保存しない
    resolved_currency: str | None = None
    if purchase_price is not None:
        resolved_currency = normalize_currency_code(currency_code)

    inserter = insert_product
    if inserter is None:
        from app.infra.supabase_user import insert_product_row

        inserter = insert_product_row

    mid = str(members_id).strip()
    token = str(access_token).strip()

    try:
        new_id = inserter(
            members_id=mid,
            access_token=token,
            product_name=name,
            photo_id=photo_id,
            barcode_number=(barcode_number or "").strip() or None,
            barcode_type=(barcode_type or "").strip() or "UNKNOWN",
            product_group_name=(product_group_name or "").strip() or None,
            works_series_name=(works_series_name or "").strip() or None,
            title=(title or "").strip() or None,
            character_name=(character_name or "").strip() or None,
            purchase_price=purchase_price,
            currency_code=resolved_currency,
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
            members_id=mid,
            access_token=token,
            registered_product_id=new_id,
            slots=color_tag_slots,
        )

    # 登録ウィザード向け「よく使う収納」カウンタ（詳細 PATCH では増やさない）
    if storage_location_id is not None:
        picker = record_storage_pick
        if picker is None:
            from app.services.tag_service import record_storage_location_register_pick

            picker = record_storage_location_register_pick
        try:
            picker(
                members_id=mid,
                access_token=token,
                storage_location_id=int(storage_location_id),
            )
        except Exception:
            logger.exception("収納の登録回数更新に失敗（製品登録は成功）")

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

    patch_fields = dict(fields)
    if "currency_code" in patch_fields:
        patch_fields["currency_code"] = normalize_currency_code(
            patch_fields.get("currency_code")
        )
    if patch_fields:
        patch_product_row(
            members_id=str(members_id).strip(),
            access_token=str(access_token).strip(),
            registered_product_id=registered_product_id,
            fields=patch_fields,
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


def bulk_patch_products_for_member(
    members_id: str,
    *,
    access_token: str,
    registered_product_ids: list[int],
    storage_location_id: int | None = None,
    clear_storage_location: bool = False,
    category_tag_id: int | None = None,
    clear_category_tag: bool = False,
) -> dict[str, Any]:
    """複数製品の収納・カテゴリを一括更新。所有外 ID があれば全体エラー。"""
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")

    storage_touched = clear_storage_location or storage_location_id is not None
    category_touched = clear_category_tag or category_tag_id is not None
    if not storage_touched and not category_touched:
        raise ValueError("収納またはカテゴリのいずれかを指定してください")
    if clear_storage_location and storage_location_id is not None:
        raise ValueError("収納の指定とクリアは同時にできません")
    if clear_category_tag and category_tag_id is not None:
        raise ValueError("カテゴリの指定とクリアは同時にできません")

    seen: set[int] = set()
    ids: list[int] = []
    for raw in registered_product_ids:
        try:
            n = int(raw)
        except (TypeError, ValueError) as exc:
            raise ValueError("未対応の製品 ID です") from exc
        if n < 1:
            raise ValueError("未対応の製品 ID です")
        if n in seen:
            continue
        seen.add(n)
        ids.append(n)
    if not ids:
        raise ValueError("製品 ID が空です")
    if len(ids) > 100:
        raise ValueError("一度に更新できるのは 100 件までです")

    mid = str(members_id).strip()
    token = str(access_token).strip()
    from app.infra.supabase_user import (
        bulk_patch_product_fields,
        create_user_client,
    )

    client = create_user_client(token)
    owned_resp = (
        client.table("registered_product")
        .select("registered_product_id")
        .eq("members_id", mid)
        .in_("registered_product_id", ids)
        .execute()
    )
    owned: set[int] = set()
    for row in owned_resp.data or []:
        if isinstance(row, dict) and isinstance(row.get("registered_product_id"), int):
            owned.add(int(row["registered_product_id"]))
    if owned != set(ids):
        raise ValueError("一部の製品が見つからないか、権限がありません")

    fields: dict[str, Any] = {}
    if storage_touched:
        if not clear_storage_location and storage_location_id is not None:
            loc = (
                client.table("storage_location")
                .select("storage_location_id")
                .eq("members_id", mid)
                .eq("storage_location_id", int(storage_location_id))
                .limit(1)
                .execute()
            )
            if not (loc.data or []):
                raise ValueError("収納場所が見つかりません")
            fields["storage_location_id"] = int(storage_location_id)
        else:
            fields["storage_location_id"] = None
    if category_touched:
        if not clear_category_tag and category_tag_id is not None:
            cat = (
                client.table("category_tag")
                .select("category_tag_id")
                .eq("members_id", mid)
                .eq("category_tag_id", int(category_tag_id))
                .limit(1)
                .execute()
            )
            if not (cat.data or []):
                raise ValueError("カテゴリが見つかりません")
            fields["category_tag_id"] = int(category_tag_id)
        else:
            fields["category_tag_id"] = None

    bulk_patch_product_fields(
        members_id=mid,
        access_token=token,
        registered_product_ids=ids,
        fields=fields,
    )
    return {
        "updated_count": len(ids),
        "registered_product_ids": ids,
    }


# 互換エイリアス（旧名）
def bulk_patch_storage_for_member(
    members_id: str,
    *,
    access_token: str,
    registered_product_ids: list[int],
    storage_location_id: int | None,
    clear_storage_location: bool,
) -> dict[str, Any]:
    return bulk_patch_products_for_member(
        members_id,
        access_token=access_token,
        registered_product_ids=registered_product_ids,
        storage_location_id=storage_location_id,
        clear_storage_location=clear_storage_location,
    )


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
        "currency_code": row.get("currency_code"),
        "purchase_location": row.get("purchase_location"),
        "category_tag_id": row.get("category_tag_id"),
        "storage_location_id": row.get("storage_location_id"),
        "category_tag": _tag_summary_from_embed(
            row.get("category_tag") if isinstance(row.get("category_tag"), dict) else None,
            name_key="category_tag_name",
            color_key="category_tag_color",
            icon_key="category_tag_icon",
        ),
        "storage_location": _tag_summary_from_embed(
            row.get("storage_location")
            if isinstance(row.get("storage_location"), dict)
            else None,
            name_key="storage_location_name",
            icon_key="storage_location_icon",
        ),
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
