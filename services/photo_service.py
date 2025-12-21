import uuid
from typing import Any, Dict, Optional

from supabase import Client


def list_storage_buckets(supabase: Client) -> None:
    """List all storage buckets for debugging"""
    try:
        buckets = supabase.storage.list_buckets()
        print(f"DEBUG: Available buckets: {[b['name'] for b in buckets]}")
    except Exception as e:
        print(f"DEBUG: Failed to list buckets: {e}")


def upload_to_storage(
    supabase: Client,
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
) -> Optional[str]:
    file_ext = (original_filename or "jpg").split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"

    try:
        print(f"DEBUG: Checking bucket policies")
        # Check bucket policies
        try:
            policies = supabase.storage.from_("photos").list_policies()
            print(f"DEBUG: Bucket policies: {policies}")
        except Exception as policy_error:
            print(f"DEBUG: Could not check policies: {policy_error}")

        print(f"DEBUG: Uploading file {file_name} to photos bucket")
        supabase.storage.from_("photos").upload(
            file_name,
            file_bytes,
            file_options={"content-type": content_type or f"image/{file_ext}"},
        )
        print(f"DEBUG: Upload successful, getting public URL")
        # Get public URL
        public_url = supabase.storage.from_("photos").get_public_url(file_name)
        print(f"DEBUG: Public URL: {public_url}")
        return public_url
    except Exception as e:
        print(f"DEBUG: First upload attempt failed: {e}")
        try:
            print(f"DEBUG: Creating photos bucket")
            supabase.storage.create_bucket("photos", options={"public": True})
            print(f"DEBUG: Retrying upload to photos bucket")
            supabase.storage.from_("photos").upload(
                file_name,
                file_bytes,
                file_options={"content-type": content_type or f"image/{file_ext}"},
            )
            print(f"DEBUG: Second upload successful, getting public URL")
            # Get public URL
            public_url = supabase.storage.from_("photos").get_public_url(file_name)
            print(f"DEBUG: Public URL: {public_url}")
            return public_url
        except Exception as exc:
            print(f"DEBUG: Second upload attempt failed: {exc}")
            raise RuntimeError(f"画像のアップロードに失敗しました: {str(exc)}") from exc


def insert_photo_record(
    supabase: Client,
    image_url: str,
    thumbnail_url: str = None,
    front_flag: int = 1,
    theme_color: int = None,
) -> Optional[int]:
    """Insert photo record and return photo_id"""
    data = {
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
) -> None:
    """Insert product record into registration_product_information table"""
    data = {
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


def delete_all_products(supabase: Client) -> None:
    """Delete all products from registration_product_information table"""
    response = (
        supabase.table("registration_product_information")
        .delete()
        .neq("registration_product_id", 0)
        .execute()
    )
    if getattr(response, "error", None):
        raise RuntimeError(f"製品削除に失敗しました: {response.error}")


def get_all_products(supabase: Client):
    """Get all products from registration_product_information table with photo data"""
    response = (
        supabase.table("registration_product_information")
        .select("""
            *,
            photo(
                photo_thumbnail_url,
                photo_high_resolution_url,
                front_flag,
                photo_theme_color
            )
        """)
        .order("creation_date", desc=True)
        .execute()
    )
    if getattr(response, "error", None):
        raise RuntimeError(f"製品取得に失敗しました: {response.error}")
    return response.data if hasattr(response, "data") else []


def get_product_stats(supabase: Client):
    """Get product statistics from registration_product_information table"""
    if supabase is None:
        return {
            "total": 0,
            "unique": 0,
            "total_photos": 0,
            "unique_barcodes": 0,
        }

    # registration_product_information の総件数
    total_response = (
        supabase.table("registration_product_information")
        .select("photo_id,barcode_number")
        .execute()
    )
    total_rows = total_response.data if hasattr(total_response, "data") else []

    # 写真付き登録件数 (photo_id が NULL でないもの)
    total_photos = len(
        [
            row
            for row in total_rows
            if row is not None and row.get("photo_id") not in (None, "")
        ]
    )

    # ユニークバーコード（空文字/None除外）
    unique_barcodes = len(
        {
            row.get("barcode_number")
            for row in total_rows
            if row is not None and row.get("barcode_number")
        }
    )

    # 互換性維持のため従来キーも併記
    return {
        "total": len(total_rows),
        "unique": unique_barcodes,
        "total_photos": total_photos,
        "unique_barcodes": unique_barcodes,
    }


def get_random_product_with_photo(
    supabase: Client, sample_size: int = 50
) -> Optional[Dict[str, Any]]:
    """
    registration_product_information から photo を含む行を最大 sample_size 件取得し、
    写真URLを持つものからランダムに1件返す。
    """
    if supabase is None:
        return None

    response = (
        supabase.table("registration_product_information")
        .select(
            """
            *,
            photo(
                photo_thumbnail_url,
                photo_high_resolution_url
            )
        """
        )
        .order("creation_date", desc=True)
        .limit(sample_size)
        .execute()
    )
    rows = response.data if hasattr(response, "data") else []
    candidates = []
    for row in rows or []:
        if not isinstance(row, dict):
            continue
        photo = row.get("photo") or {}
        if not isinstance(photo, dict):
            continue
        url = photo.get("photo_thumbnail_url") or photo.get("photo_high_resolution_url")
        if url:
            candidates.append(row)
    if not candidates:
        return None

    import random

    return random.choice(candidates)
