import uuid
import os
import time
import threading
import requests
from typing import Any, Dict, Optional, List, Tuple

from supabase import Client

try:
    from flask import g, has_app_context
except Exception:  # pragma: no cover
    g = None
    has_app_context = lambda: False  # type: ignore

from services.supabase_client import SUPABASE_URL, PUBLISHABLE_KEY
from services.debug_log import dash_debug_print

# 署名 URL のプロセス内キャッシュ（A2: members_id + object_path、短 TTL）
_SIGN_CACHE_TTL_SEC = 90.0
_sign_cache_lock = threading.Lock()
_signed_url_cache: Dict[Tuple[str, str], Tuple[str, float]] = {}

# ギャラリー一覧用 select（* より転送量を抑える）
_GALLERY_PRODUCT_SELECT = """
    registration_product_id,
    product_name,
    product_group_name,
    works_series_name,
    title,
    character_name,
    memo,
    barcode_number,
    photo_id,
    category_tag_id,
    receipt_location_id,
    category_tag(
        category_tag_name,
        category_tag_color,
        category_tag_icon,
        category_tag_use_flag
    ),
    receipt_location(
        receipt_location_name,
        receipt_location_icon,
        receipt_location_use_flag
    ),
    photo(
        photo_thumbnail_url,
        photo_high_resolution_url,
        front_flag,
        photo_theme_color
    )
"""


def _current_members_id() -> Optional[str]:
    """flask.g から現在のユーザーIDを取得（無ければ None）。"""
    if g is None or not has_app_context():
        return None
    uid = getattr(g, "user_id", None)
    return str(uid) if uid else None


def _current_access_token() -> Optional[str]:
    """flask.g から現在のユーザーaccess_tokenを取得（無ければ None）。"""
    if g is None or not has_app_context():
        return None
    token = getattr(g, "access_token", None)
    return str(token) if token else None


def _sign_url_if_needed(supabase: Client, url: Optional[str]) -> Optional[str]:
    """http(s)でなければ object path とみなし、signed URL を発行する。"""
    if not url:
        return None
    lower = url.lower()
    if lower.startswith("http://") or lower.startswith("https://"):
        return url
    return create_signed_url_for_object(supabase, url)


def _with_signed_photo_urls(supabase: Client, rows: Any) -> Any:
    """products配列に対し、photo内のobject pathをsigned URLに置き換える。"""
    if not isinstance(rows, list):
        return rows
    signed_rows: List[Dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            signed_rows.append(row)
            continue
        photo_field = row.get("photo")
        if isinstance(photo_field, dict):
            pf = dict(photo_field)
            pf["photo_thumbnail_url"] = _sign_url_if_needed(
                supabase, pf.get("photo_thumbnail_url")
            )
            pf["photo_high_resolution_url"] = _sign_url_if_needed(
                supabase, pf.get("photo_high_resolution_url")
            )
            row = dict(row)
            row["photo"] = pf
        elif isinstance(photo_field, list):
            signed_list = []
            for item in photo_field:
                if not isinstance(item, dict):
                    continue
                it = dict(item)
                it["photo_thumbnail_url"] = _sign_url_if_needed(
                    supabase, it.get("photo_thumbnail_url")
                )
                it["photo_high_resolution_url"] = _sign_url_if_needed(
                    supabase, it.get("photo_high_resolution_url")
                )
                signed_list.append(it)
            row = dict(row)
            row["photo"] = signed_list
        # top-level fallback
        row["photo_thumbnail_url"] = _sign_url_if_needed(
            supabase, row.get("photo_thumbnail_url")
        )
        row["photo_high_resolution_url"] = _sign_url_if_needed(
            supabase, row.get("photo_high_resolution_url")
        )
        signed_rows.append(row)
    return signed_rows


def list_storage_buckets(supabase: Client) -> None:
    """List all storage buckets for debugging"""
    try:
        buckets = supabase.storage.list_buckets()
        dash_debug_print(f"DEBUG: Available buckets: {[b['name'] for b in buckets]}")
    except Exception as e:
        dash_debug_print(f"DEBUG: Failed to list buckets: {e}")


def upload_to_storage(
    supabase: Client,
    members_id: str,
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
) -> Optional[str]:
    """
    photosバケット(Private想定)に {members_id}/{uuid}.{ext} で保存し、object path を返す。
    public URL は返さない。バケット未作成/権限不足なら例外を投げる。
    """
    if not members_id:
        raise RuntimeError("members_id is required for upload.")
    file_ext = (original_filename or "jpg").split(".")[-1]
    object_path = f"{members_id}/{uuid.uuid4()}.{file_ext}"

    try:
        supabase.storage.from_("photos").upload(
            object_path,
            file_bytes,
            file_options={"content-type": content_type or f"image/{file_ext}"},
        )
        dash_debug_print(f"DEBUG: Upload successful, object_path={object_path}")
        return object_path
    except Exception as exc:
        dash_debug_print(f"DEBUG: Upload failed: {exc}")
        raise


def _sign_cache_key(members_id: Optional[str], object_path: str) -> Optional[Tuple[str, str]]:
    if not members_id or not object_path:
        return None
    return (str(members_id), str(object_path).lstrip("/"))


def _sign_cache_get(key: Tuple[str, str]) -> Optional[str]:
    now = time.monotonic()
    with _sign_cache_lock:
        entry = _signed_url_cache.get(key)
        if not entry:
            return None
        url, exp = entry
        if exp < now:
            del _signed_url_cache[key]
            return None
        return url


def _sign_cache_set(key: Tuple[str, str], url: str) -> None:
    exp = time.monotonic() + _SIGN_CACHE_TTL_SEC
    with _sign_cache_lock:
        if len(_signed_url_cache) > 4096:
            _signed_url_cache.clear()
        _signed_url_cache[key] = (url, exp)


def create_signed_url_for_object(
    supabase: Client,
    object_path: str,
    expires_in: int = 3600,
) -> Optional[str]:
    """
    Storage REST API を直接叩いて signed URL を作成する。
    """
    if not supabase or not object_path or not SUPABASE_URL or not PUBLISHABLE_KEY:
        return None

    access_token = _current_access_token()
    if not access_token:
        return None

    ck = _sign_cache_key(_current_members_id(), object_path)
    if ck:
        cached = _sign_cache_get(ck)
        if cached:
            return cached

    url = f"{SUPABASE_URL}/storage/v1/object/sign/photos/{object_path.lstrip('/')}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": PUBLISHABLE_KEY,
        "Content-Type": "application/json",
    }
    payload = {"expiresIn": expires_in}
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        if resp.status_code >= 400:
            # 署名 URL 全文はログに出さない（レスポンス本文は短く切る）
            body = (resp.text or "")[:240]
            dash_debug_print(
                f"DEBUG: create_signed_url failed: status={resp.status_code} body={body!r}"
            )
            return None
        data = resp.json() or {}
        signed = data.get("signedURL") or data.get("signedUrl") or data.get("signed_url")
        if signed and signed.startswith("http"):
            if ck:
                _sign_cache_set(ck, signed)
            return signed
        if signed:
            # relative -> make absolute
            # Supabaseの返却が "/object/sign/..." の場合があるため "/storage/v1" を補完する
            if signed.startswith("/object/"):
                signed = f"/storage/v1{signed}"
            elif not signed.startswith("/storage/"):
                # 念のため、想定外の相対パスは storage/v1 配下に寄せる
                signed = f"/storage/v1{signed if signed.startswith('/') else '/' + signed}"
            out = f"{SUPABASE_URL}{signed}"
            if ck:
                _sign_cache_set(ck, out)
            return out
        return None
    except Exception as exc:
        dash_debug_print(f"DEBUG: create_signed_url exception: {exc}")
        return None


def insert_photo_record(
    supabase: Client,
    members_id: str,
    image_url: str,
    thumbnail_url: str = None,
    front_flag: int = 1,
    theme_color: int = None,
) -> Optional[int]:
    """Insert photo record and return photo_id"""
    if not members_id:
        raise RuntimeError("members_id is required to insert photo.")
    data = {
        "members_id": members_id,
        "photo_thumbnail_url": thumbnail_url or image_url,
        "photo_high_resolution_url": image_url,
        "front_flag": front_flag,
        "photo_registration_date": "NOW()",
        "photo_edit_date": "NOW()",
    }

    if theme_color:
        data["photo_theme_color"] = theme_color

    response = supabase.table("photo").insert(data).execute()
    if getattr(response, "error", None):
        raise RuntimeError(f"写真レコードの挿入に失敗しました: {response.error}")

    # Return the inserted photo_id
    if hasattr(response, "data") and response.data:
        return response.data[0].get("photo_id")
    return None


def insert_product_record(
    supabase: Client,
    members_id: str,
    photo_id: int = None,
    barcode: str = None,
    barcode_type: str = None,
    product_name: str = None,
    product_group_name: str = None,
    works_series_name: str = None,
    title: str = None,
    character_name: str = None,
    purchase_price: int = None,
    purchase_location: str = None,
    memo: str = None,
    product_series_flag: int = 0,
    product_series_complete_flag: int = 0,
    commercial_product_flag: int = 1,
    personal_product_flag: int = 0,
    digital_product_flag: int = 0,
    sales_desired_flag: int = 0,
    want_object_flag: int = 0,
    flag_with_freebie: int = 0,
) -> Optional[int]:
    """Insert product record and return registration_product_id."""
    if not members_id:
        raise RuntimeError("members_id is required to insert product.")
    data = {
        "members_id": members_id,
        "photo_id": photo_id,
        "product_name": product_name,
        "product_group_name": product_group_name,
        "works_series_name": works_series_name,
        "title": title,
        "character_name": character_name,
        "barcode_number": barcode,
        "barcode_type": barcode_type,
        "purchase_price": purchase_price,
        "purchase_location": purchase_location,
        "memo": memo,
        "product_series_flag": product_series_flag,
        "product_series_complete_flag": product_series_complete_flag,
        "commercial_product_flag": commercial_product_flag,
        "personal_product_flag": personal_product_flag,
        "digital_product_flag": digital_product_flag,
        "sales_desired_flag": sales_desired_flag,
        "want_object_flag": want_object_flag,
        "flag_with_freebie": flag_with_freebie,
        "creation_date": "NOW()",
        "updated_date": "NOW()",
    }

    if photo_id:
        data["photo_id"] = photo_id

    response = supabase.table("registration_product_information").insert(data).execute()
    if getattr(response, "error", None):
        raise RuntimeError(f"製品レコードの挿入に失敗しました: {response.error}")

    if hasattr(response, "data") and response.data:
        return response.data[0].get("registration_product_id")
    return None


def delete_all_products(supabase: Client) -> None:
    """Delete all products from registration_product_information table"""
    members_id = _current_members_id()
    if not members_id:
        raise RuntimeError("members_id is required to delete products.")
    response = (
        supabase.table("registration_product_information")
        .delete()
        .eq("members_id", members_id)
        .execute()
    )
    if getattr(response, "error", None):
        raise RuntimeError(f"製品削除に失敗しました: {response.error}")


def get_products_page(
    supabase: Client,
    *,
    limit: int = 48,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """
    ギャラリー用: 1 ページ分のみ取得し、その行にだけ署名 URL を付与する（A1）。
    """
    members_id = _current_members_id()
    if not members_id or supabase is None:
        return []
    if limit <= 0:
        return []
    end = offset + limit - 1
    response = (
        supabase.table("registration_product_information")
        .select(_GALLERY_PRODUCT_SELECT)
        .eq("members_id", members_id)
        .order("creation_date", desc=True)
        .range(offset, end)
        .execute()
    )
    if getattr(response, "error", None):
        raise RuntimeError(f"製品取得に失敗しました: {response.error}")
    data = response.data if hasattr(response, "data") else []
    return _with_signed_photo_urls(supabase, data)


def get_all_products(supabase: Client):
    """
    全件取得（互換・デモ用）。件数が多いと署名コストが高いため、UI は get_products_page を推奨。
    """
    return get_products_page(supabase, limit=10_000, offset=0)


def _get_product_stats_fallback(supabase: Client, members_id: str) -> Dict[str, Any]:
    """RPC 未適用 DB 向けの軽量フォールバック（件数は head、ユニークは barcode のみ列で取得）。"""
    total_resp = (
        supabase.table("registration_product_information")
        .select("registration_product_id", count="exact", head=True)
        .eq("members_id", members_id)
        .execute()
    )
    total = int(getattr(total_resp, "count", None) or 0)

    photos_resp = (
        supabase.table("registration_product_information")
        .select("registration_product_id", count="exact", head=True)
        .eq("members_id", members_id)
        .not_.is_("photo_id", "null")
        .execute()
    )
    total_photos = int(getattr(photos_resp, "count", None) or 0)

    bc_resp = (
        supabase.table("registration_product_information")
        .select("barcode_number")
        .eq("members_id", members_id)
        .execute()
    )
    bc_rows = bc_resp.data if hasattr(bc_resp, "data") else []
    unique_barcodes = len(
        {
            str(r.get("barcode_number")).strip()
            for r in bc_rows or []
            if isinstance(r, dict)
            and r.get("barcode_number") is not None
            and str(r.get("barcode_number")).strip() != ""
        }
    )

    return {
        "total": total,
        "unique": unique_barcodes,
        "total_photos": total_photos,
        "unique_barcodes": unique_barcodes,
    }


def get_product_stats(supabase: Client):
    """registration_product_information の集計（可能なら DB 側 RPC で全行取得を避ける）。"""
    members_id = _current_members_id()
    if supabase is None or not members_id:
        return {
            "total": 0,
            "unique": 0,
            "total_photos": 0,
            "unique_barcodes": 0,
        }

    try:
        rpc = supabase.rpc("app_registration_product_stats").execute()
        rows = rpc.data if hasattr(rpc, "data") else None
        if isinstance(rows, dict):
            rows = [rows]
        if rows and isinstance(rows, list) and isinstance(rows[0], dict):
            row = rows[0]
            ub = int(row.get("unique_barcodes") or 0)
            return {
                "total": int(row.get("total") or 0),
                "unique": ub,
                "total_photos": int(row.get("total_photos") or 0),
                "unique_barcodes": ub,
            }
    except Exception:
        pass

    return _get_product_stats_fallback(supabase, str(members_id))


def get_random_product_with_photo(
    supabase: Client, sample_size: int = 50
) -> Optional[Dict[str, Any]]:
    """
    候補は最大 sample_size 件を未署名で取得し、ランダムに 1 件選んでから署名する（ホーム負荷軽減）。
    """
    if supabase is None:
        return None

    members_id = _current_members_id()
    if not members_id:
        return None

    response = (
        supabase.table("registration_product_information")
        .select(
            """
            registration_product_id,
            product_name,
            barcode_number,
            photo(
                photo_thumbnail_url,
                photo_high_resolution_url
            )
            """
        )
        .eq("members_id", members_id)
        .order("creation_date", desc=True)
        .limit(sample_size)
        .execute()
    )
    rows = response.data if hasattr(response, "data") else []
    candidates: List[Dict[str, Any]] = []
    for row in rows or []:
        if not isinstance(row, dict):
            continue
        photo = row.get("photo") or {}
        if isinstance(photo, dict):
            url = photo.get("photo_thumbnail_url") or photo.get("photo_high_resolution_url")
            if url:
                candidates.append(row)
        elif isinstance(photo, list):
            for item in photo:
                if not isinstance(item, dict):
                    continue
                url = item.get("photo_thumbnail_url") or item.get("photo_high_resolution_url")
                if url:
                    candidates.append(row)
                    break
    if not candidates:
        return None

    import random

    chosen = random.choice(candidates)
    signed_list = _with_signed_photo_urls(supabase, [chosen])
    if signed_list and isinstance(signed_list[0], dict):
        return signed_list[0]
    return chosen
