"""Icon management service for centralized icon handling."""

from typing import Dict, List, Any
from services.supabase_client import get_supabase_client


def get_category_icons() -> List[Dict[str, Any]]:
    """Get icons available for category tags."""
    supabase = get_supabase_client()
    if not supabase:
        return []

    try:
        response = (
            supabase.table("icon_tag")
            .select("*")
            .eq("category_tag_use_flag", 1)
            .execute()
        )
        return response.data if response.data else []
    except Exception:
        return []


def get_receipt_location_icons() -> List[Dict[str, Any]]:
    """Get icons available for receipt location tags."""
    supabase = get_supabase_client()
    if not supabase:
        return []

    try:
        response = (
            supabase.table("icon_tag")
            .select("*")
            .eq("receipt_location_use_flag", 1)
            .execute()
        )
        return response.data if response.data else []
    except Exception:
        return []


def get_receipt_location_icons_sorted() -> List[Dict[str, Any]]:
    """収納場所用 icon_tag を表示用に icon_name 順で並べる。"""
    rows = get_receipt_location_icons()
    return sorted(
        rows,
        key=lambda x: ((x.get("icon_name") or ""), (x.get("icon") or "")),
    )


def get_all_icons() -> List[Dict[str, Any]]:
    """Get all icons."""
    supabase = get_supabase_client()
    if not supabase:
        return []

    try:
        response = supabase.table("icon_tag").select("*").execute()
        return response.data if response.data else []
    except Exception:
        return []


def create_icon(
    icon: str, icon_name: str, category_use: int = 1, receipt_use: int = 1
) -> bool:
    """Create a new icon."""
    supabase = get_supabase_client()
    if not supabase:
        return False

    try:
        supabase.table("icon_tag").insert(
            {
                "icon": icon,
                "icon_name": icon_name,
                "category_tag_use_flag": category_use,
                "receipt_location_use_flag": receipt_use,
            }
        ).execute()
        return True
    except Exception:
        return False


def update_icon(
    icon: str, icon_name: str = None, category_use: int = None, receipt_use: int = None
) -> bool:
    """Update an icon."""
    supabase = get_supabase_client()
    if not supabase:
        return False

    try:
        update_data = {}
        if icon_name is not None:
            update_data["icon_name"] = icon_name
        if category_use is not None:
            update_data["category_tag_use_flag"] = category_use
        if receipt_use is not None:
            update_data["receipt_location_use_flag"] = receipt_use

        if update_data:
            supabase.table("icon_tag").update(update_data).eq("icon", icon).execute()
        return True
    except Exception:
        return False
