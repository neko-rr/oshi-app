"""ユーザー別推し色設定（oshi_accent_settings）。

適用・永続化は entitlement（プレミアム想定）。未 entitlement は拒否。
"""

from __future__ import annotations

import logging
import os
from typing import Any

from app.infra.supabase_user import create_user_client
from app.services.oshi_contrast import (
    DEFAULT_MAIN_HEX,
    DEFAULT_SUB_HEX,
    normalize_hex,
    resolve_oshi_colors,
)

logger = logging.getLogger(__name__)

DEFAULT_MEMBERS_TYPE_NAME = "default"
MAX_PRESETS = 3
SELECT_COLS = "main_hex,sub_hex,active,presets"


class PremiumRequiredError(PermissionError):
    """推し色の保存・適用にはプレミアムが必要。"""


def is_oshi_accent_entitled() -> bool:
    """課金前は既定 false。開発確認のみ OSHI_ACCENT_ENTITLED=1/true。"""
    raw = (os.environ.get("OSHI_ACCENT_ENTITLED") or "").strip().lower()
    return raw in {"1", "true", "yes", "on"}


def _default_payload(*, entitled: bool) -> dict[str, Any]:
    resolved = resolve_oshi_colors(DEFAULT_MAIN_HEX, DEFAULT_SUB_HEX)
    return {
        "main_hex": resolved["main_hex"],
        "sub_hex": resolved["sub_hex"],
        "main_foreground": resolved["main_foreground"],
        "soft_bg": resolved["soft_bg"],
        "soft_foreground": resolved["soft_foreground"],
        "active": False,
        "presets": [],
        "entitled": entitled,
        "max_presets": MAX_PRESETS,
    }


def _normalize_preset(raw: Any) -> dict[str, str]:
    if not isinstance(raw, dict):
        raise ValueError("プリセットの形式が不正です")
    name = str(raw.get("name") or "").strip()
    if not name or len(name) > 40:
        raise ValueError("プリセット名が不正です")
    main = normalize_hex(str(raw.get("main_hex") or ""))
    sub = normalize_hex(str(raw.get("sub_hex") or ""))
    resolve_oshi_colors(main, sub)
    return {"name": name, "main_hex": main, "sub_hex": sub}


def _normalize_presets(raw: Any) -> list[dict[str, str]]:
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise ValueError("プリセットの形式が不正です")
    if len(raw) > MAX_PRESETS:
        raise ValueError(f"プリセットは最大{MAX_PRESETS}組までです")
    return [_normalize_preset(item) for item in raw]


def _row_to_response(row: dict[str, Any], *, entitled: bool) -> dict[str, Any]:
    main = normalize_hex(str(row.get("main_hex") or DEFAULT_MAIN_HEX))
    sub = normalize_hex(str(row.get("sub_hex") or DEFAULT_SUB_HEX))
    resolved = resolve_oshi_colors(main, sub)
    presets_raw = row.get("presets")
    presets = presets_raw if isinstance(presets_raw, list) else []
    active = bool(row.get("active")) if entitled else False
    return {
        "main_hex": resolved["main_hex"],
        "sub_hex": resolved["sub_hex"],
        "main_foreground": resolved["main_foreground"],
        "soft_bg": resolved["soft_bg"],
        "soft_foreground": resolved["soft_foreground"],
        "active": active,
        "presets": presets,
        "entitled": entitled,
        "max_presets": MAX_PRESETS,
    }


def get_oshi_accent(*, members_id: str, access_token: str) -> dict[str, Any]:
    entitled = is_oshi_accent_entitled()
    if not entitled:
        return _default_payload(entitled=False)

    client = create_user_client(access_token)
    resp = (
        client.table("oshi_accent_settings")
        .select(SELECT_COLS)
        .eq("members_id", members_id)
        .eq("members_type_name", DEFAULT_MEMBERS_TYPE_NAME)
        .limit(1)
        .execute()
    )
    rows: list[dict[str, Any]] = list(resp.data or [])
    if not rows:
        return _default_payload(entitled=True)
    return _row_to_response(rows[0], entitled=True)


def save_oshi_accent(
    *,
    members_id: str,
    access_token: str,
    main_hex: str,
    sub_hex: str,
    active: bool,
    presets: Any,
) -> dict[str, Any]:
    if not is_oshi_accent_entitled():
        raise PremiumRequiredError("推し色の保存・適用にはプレミアムが必要です")

    resolved = resolve_oshi_colors(main_hex, sub_hex)
    normalized_presets = _normalize_presets(presets)
    client = create_user_client(access_token)
    payload = {
        "members_id": members_id,
        "members_type_name": DEFAULT_MEMBERS_TYPE_NAME,
        "main_hex": resolved["main_hex"],
        "sub_hex": resolved["sub_hex"],
        "active": bool(active),
        "presets": normalized_presets,
    }
    client.table("oshi_accent_settings").upsert(
        payload, on_conflict="members_id,members_type_name"
    ).execute()
    return {
        **resolved,
        "active": bool(active),
        "presets": normalized_presets,
        "entitled": True,
        "max_presets": MAX_PRESETS,
    }
