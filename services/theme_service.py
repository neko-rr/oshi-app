from typing import Optional

from services.supabase_client import get_supabase_client

DEFAULT_THEME = "minty"
TABLE_NAME = "theme_settings"
DEFAULT_MEMBERS_TYPE_NAME = "default"


def get_theme(
    members_id: Optional[str] = None, members_type_name: Optional[str] = None
) -> str:
    """
    Supabase からテーマ設定を取得。未設定・未接続時はデフォルトを返す。
    members_id が無い場合はデフォルトを返す（ゲスト固定IDは廃止）。
    """
    supabase = get_supabase_client()
    if supabase is None or not members_id:
        return DEFAULT_THEME

    mtype = members_type_name or DEFAULT_MEMBERS_TYPE_NAME

    try:
        res = (
            supabase.table(TABLE_NAME)
            .select("theme")
            .eq("members_id", members_id)
            .eq("members_type_name", mtype)
            .limit(1)
            .execute()
        )
        data = res.data or []
        if data:
            theme = data[0].get("theme")
            return theme or DEFAULT_THEME
    except Exception as exc:
        print(f"DEBUG: get_theme failed: {exc}")
    return DEFAULT_THEME


def set_theme(
    theme: str,
    members_id: Optional[str] = None,
    members_type_name: Optional[str] = None,
) -> bool:
    """
    Supabase にテーマ設定を保存。members_id が無い場合は保存せず False。
    """
    supabase = get_supabase_client()
    if supabase is None or not members_id:
        return False

    mtype = members_type_name or DEFAULT_MEMBERS_TYPE_NAME

    try:
        payload = {
            "members_id": members_id,
            "members_type_name": mtype,
            "theme": theme,
        }
        supabase.table(TABLE_NAME).upsert(
            payload, on_conflict="members_id,members_type_name"
        ).execute()
        return True
    except Exception as exc:
        print(f"DEBUG: set_theme failed: {exc}")
        return False
