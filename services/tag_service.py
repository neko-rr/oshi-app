"""Tag management service for color tags, category tags, and receipt location tags."""

import re
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


# 初期7色（slot固定）
DEFAULT_COLOR_TAGS: List[Dict[str, Any]] = [
    {"slot": 1, "color_tag_name": "赤", "color_tag_color": "#dc3545"},
    {"slot": 2, "color_tag_name": "青", "color_tag_color": "#0d6efd"},
    {"slot": 3, "color_tag_name": "緑", "color_tag_color": "#198754"},
    {"slot": 4, "color_tag_name": "黄", "color_tag_color": "#ffc107"},
    {"slot": 5, "color_tag_name": "紫", "color_tag_color": "#6f42c1"},
    {"slot": 6, "color_tag_name": "黒", "color_tag_color": "#212529"},
    {"slot": 7, "color_tag_name": "白", "color_tag_color": "#f8f9fa"},
]

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


def _validate_color_tag_entries(entries: List[Dict[str, Any]]) -> bool:
    if len(entries) != 7:
        return False
    for e in entries:
        if not isinstance(e, dict):
            return False
        if not (1 <= int(e.get("slot", 0)) <= 7):
            return False
        name = (e.get("color_tag_name") or "").strip()
        color = e.get("color_tag_color") or ""
        if not name:
            return False
        if not HEX_RE.match(color):
            return False
    return True


def ensure_default_color_tags() -> List[Dict[str, Any]]:
    """足りない slot に初期7色を投入し、slot順で返す。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return []
    try:
        # 既存を取得
        resp = (
            supabase.table("color_tag")
            .select("*")
            .eq("members_id", members_id)
            .order("slot")
            .execute()
        )
        existing = resp.data or []
        filled_slots = {int(item.get("slot")) for item in existing if item.get("slot")}
        # 足りないslotだけ insert
        missing_payload = [
            dict(dc, members_id=members_id)
            for dc in DEFAULT_COLOR_TAGS
            if dc["slot"] not in filled_slots
        ]
        if missing_payload:
            supabase.table("color_tag").upsert(
                missing_payload, on_conflict="members_id,slot"
            ).execute()
            # 再取得
            resp = (
                supabase.table("color_tag")
                .select("*")
                .eq("members_id", members_id)
                .order("slot")
                .execute()
            )
            return resp.data or []
        return existing
    except Exception:
        return []


def save_color_tags(entries: List[Dict[str, Any]]) -> bool:
    """7件まとめて保存（slot=1..7）。"""
    if not _validate_color_tag_entries(entries):
        return False
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False
    payload = []
    for e in entries:
        payload.append(
            {
                "members_id": members_id,
                "slot": int(e["slot"]),
                "color_tag_name": (e.get("color_tag_name") or "").strip(),
                "color_tag_color": e.get("color_tag_color"),
            }
        )
    try:
        supabase.table("color_tag").upsert(
            payload, on_conflict="members_id,slot"
        ).execute()
        return True
    except Exception:
        return False


def get_color_tags_ordered() -> List[Dict[str, Any]]:
    """slot順で取得。足りない場合は初期化してから返す。"""
    ensured = ensure_default_color_tags()
    # ensureで失敗した場合はそのまま返る（空or部分的）
    return sorted(
        ensured, key=lambda x: int(x.get("slot") or 0)
    )


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