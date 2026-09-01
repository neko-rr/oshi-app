"""ユーザー別テーマ設定（theme_settings）。

todo-app 方式: theme ID → Web の colors.css がセマンティック変数一式を切替。
Dash/Bootswatch 名（minty/quartz/morph 等）は allowlist 外 → default（緑系）。
"""

from __future__ import annotations

import logging
from typing import Any

from app.infra.supabase_user import create_user_client

logger = logging.getLogger(__name__)

# 会員種別は未 wire のため固定キー（PK の一部）
DEFAULT_MEMBERS_TYPE_NAME = "default"

# 緑系 :root / data-theme=default（todo-app と同系）
DEFAULT_THEME = "default"

# colors.css の data-theme と一致（未知値をそのまま載せない）
ALLOWED_THEMES = frozenset(
    {
        "default",
        "lime-right",
        "yellow-dark",
        "orange-dark",
        "red-dark",
        "lime-dark",
        "emerald-dark",
        "sky-dark",
        "blue-dark",
        "pink-dark",
        "purple-dark",
    }
)


def _normalize_theme(theme: str) -> str:
    value = (theme or "").strip()
    if value not in ALLOWED_THEMES:
        raise ValueError("未対応のテーマです")
    return value


def get_theme(*, members_id: str, access_token: str) -> str:
    client = create_user_client(access_token)
    resp = (
        client.table("theme_settings")
        .select("theme")
        .eq("members_id", members_id)
        .eq("members_type_name", DEFAULT_MEMBERS_TYPE_NAME)
        .limit(1)
        .execute()
    )
    rows: list[dict[str, Any]] = list(resp.data or [])
    if not rows:
        return DEFAULT_THEME
    raw = str(rows[0].get("theme") or "").strip()
    if raw not in ALLOWED_THEMES:
        return DEFAULT_THEME
    return raw


def save_theme(*, members_id: str, access_token: str, theme: str) -> str:
    normalized = _normalize_theme(theme)
    client = create_user_client(access_token)
    payload = {
        "members_id": members_id,
        "members_type_name": DEFAULT_MEMBERS_TYPE_NAME,
        "theme": normalized,
    }
    client.table("theme_settings").upsert(
        payload, on_conflict="members_id,members_type_name"
    ).execute()
    return normalized
