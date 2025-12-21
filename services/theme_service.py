from typing import Optional

from services.supabase_client import get_supabase_client

DEFAULT_THEME = "minty"
TABLE_NAME = "theme_settings"

# ゲスト固定値（認証導入前は全員これを使う）
GUEST_MEMBERS_ID = 9999
GUEST_MEMBERS_TYPE_NAME = "guest"


def get_theme(
    members_id: Optional[int] = None, members_type_name: Optional[str] = None
) -> str:
    """Supabase からテーマ設定を取得。未設定・未接続時はデフォルトを返す。"""
    supabase = get_supabase_client()
    if supabase is None:
        return DEFAULT_THEME

    mid = members_id if members_id is not None else GUEST_MEMBERS_ID
    mtype = (
        members_type_name if members_type_name is not None else GUEST_MEMBERS_TYPE_NAME
    )

    try:
        res = (
            supabase.table(TABLE_NAME)
            .select("theme")
            .eq("members_id", mid)
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
    members_id: Optional[int] = None,
    members_type_name: Optional[str] = None,
) -> bool:
    """Supabase にテーマ設定を保存。接続不可時は False を返す。"""
    supabase = get_supabase_client()
    if supabase is None:
        return False

    mid = members_id if members_id is not None else GUEST_MEMBERS_ID
    mtype = (
        members_type_name if members_type_name is not None else GUEST_MEMBERS_TYPE_NAME
    )

    try:
        payload = {
            "members_id": mid,
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
