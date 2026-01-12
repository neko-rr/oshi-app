"""Tag management service for color tags, category tags, and receipt location tags."""

from typing import Dict, List, Any, Optional
from services.supabase_client import get_supabase_client

try:
    from flask import g, has_app_context
except Exception:  # pragma: no cover
    g = None
    has_app_context = lambda: False  # type: ignore


def _current_members_id() -> Optional[str]:
    if g is None or not has_app_context():
        return None
    uid = getattr(g, "user_id", None)
    return str(uid) if uid else None


def get_color_tags() -> List[Dict[str, Any]]:
    """Get all color tags."""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return []

    try:
        response = (
            supabase.table("color_tag")
            .select("*")
            .eq("members_id", members_id)
            .execute()
        )
        return response.data if response.data else []
    except Exception:
        return []


def get_category_tags() -> List[Dict[str, Any]]:
    """Get all category tags."""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return []

    try:
        response = (
            supabase.table("category_tag")
            .select("*")
            .eq("members_id", members_id)
            .execute()
        )
        return response.data if response.data else []
    except Exception:
        return []


def get_receipt_location_tags() -> List[Dict[str, Any]]:
    """Get all receipt location tags."""
    supabase = get_supabase_client()
    if not supabase:
        return []

    try:
        response = supabase.table("receipt_location").select("*").execute()
        return response.data if response.data else []
    except Exception:
        return []


def update_color_tag(color_tag_id: int, name: str, color: str) -> bool:
    """Update a color tag."""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False

    try:
        supabase.table("color_tag").update(
            {"color_tag_name": name, "color_tag_color": color}
        ).eq("color_tag_id", color_tag_id).eq("members_id", members_id).execute()
        return True
    except Exception:
        return False


def update_category_tag(category_tag_id: int, name: str, color: str, icon: str) -> bool:
    """Update a category tag."""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False

    try:
        supabase.table("category_tag").update(
            {
                "category_tag_name": name,
                "category_tag_color": color,
                "category_tag_icon": icon,
            }
        ).eq("category_tag_id", category_tag_id).eq("members_id", members_id).execute()
        return True
    except Exception:
        return False


def update_receipt_location_tag(receipt_location_id: int, name: str, icon: str) -> bool:
    """Update a receipt location tag."""
    supabase = get_supabase_client()
    if not supabase:
        return False

    try:
        supabase.table("receipt_location").update(
            {"receipt_location_name": name, "receipt_location_icon": icon}
        ).eq("receipt_location_id", receipt_location_id).execute()
        return True
    except Exception:
        return False


def create_color_tag(name: str, color: str) -> bool:
    """Create a new color tag."""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False

    try:
        supabase.table("color_tag").insert(
            {"color_tag_name": name, "color_tag_color": color, "members_id": members_id}
        ).execute()
        return True
    except Exception:
        return False


def create_category_tag(name: str, color: str, icon: str) -> bool:
    """Create a new category tag."""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False

    try:
        supabase.table("category_tag").insert(
            {
                "members_id": members_id,
                "category_tag_name": name,
                "category_tag_color": color,
                "category_tag_icon": icon,
                "category_tag_use_flag": 1,
            }
        ).execute()
        return True
    except Exception:
        return False


def create_receipt_location_tag(name: str, icon: str) -> bool:
    """Create a new receipt location tag."""
    supabase = get_supabase_client()
    if not supabase:
        return False

    try:
        supabase.table("receipt_location").insert(
            {
                "receipt_location_name": name,
                "receipt_location_icon": icon,
                "receipt_location_use_flag": 1,
            }
        ).execute()
        return True
    except Exception:
        return False


def _update_tags(state: Dict[str, Any]) -> Dict[str, Any]:
    """Update tags based on lookup data and image description."""
    items = state["lookup"].get("items") or []
    description = state["front_photo"].get("description")

    print(
        f"DEBUG: _update_tags called - items: {len(items)}, description: {bool(description)}"
    )

    # 4つのパターンを適切に処理
    has_rakuten_data = bool(items)
    has_image_description = bool(description)

    print(
        f"DEBUG: has_rakuten_data: {has_rakuten_data}, has_image_description: {has_image_description}"
    )

    if not has_rakuten_data and not has_image_description:
        state["tags"] = {
            "status": "not_ready",
            "tags": [],
            "message": "バーコード照合または画像説明の結果が揃うとタグを生成します。",
        }
        return state["tags"]

    # IO Intelligence APIでタグを生成
    print("DEBUG: Calling extract_tags...")
    photo_content = state.get("front_photo", {}).get("content")
    from services.tag_extraction import extract_tags
    tag_result = extract_tags(items, description, photo_content)
    print(f"DEBUG: extract_tags result: {tag_result}")

    # タグ生成結果に応じてメッセージを調整（既にメッセージがあれば優先）
    if tag_result["status"] == "success" and not tag_result.get("message"):
        if has_rakuten_data and has_image_description:
            tag_result["message"] = (
                f"楽天API情報と画像説明から{len(tag_result['tags'])}個のタグを生成しました。"
            )
        elif has_rakuten_data:
            tag_result["message"] = (
                f"楽天API情報から{len(tag_result['tags'])}個のタグを生成しました。"
            )
        elif has_image_description:
            tag_result["message"] = (
                f"画像説明から{len(tag_result['tags'])}個のタグを生成しました。"
            )

    state["tags"] = tag_result
    return tag_result