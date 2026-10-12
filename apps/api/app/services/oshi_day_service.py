"""キャラごとの推し何日目。開始日がその日を1日目にする。"""

from __future__ import annotations

import logging
import unicodedata
from datetime import date, datetime
from typing import Any

from app.infra.supabase_user import create_user_client

logger = logging.getLogger(__name__)

MAX_NAME_LEN = 80


def normalize_character_name(raw: Any) -> str:
    text = unicodedata.normalize("NFKC", str(raw or ""))
    name = " ".join(text.split())
    if not name:
        raise ValueError("キャラクター名を入力してください")
    if len(name) > MAX_NAME_LEN:
        raise ValueError(f"キャラクター名は{MAX_NAME_LEN}文字以内にしてください")
    return name


def _parse_date(raw: Any) -> date | None:
    if isinstance(raw, datetime):
        return raw.date()
    if isinstance(raw, date):
        return raw
    text = str(raw or "").strip()
    if len(text) >= 10:
        text = text[:10]
    try:
        return datetime.strptime(text, "%Y-%m-%d").date()
    except ValueError:
        return None


def oshi_day_count(start: date, today: date) -> tuple[int | None, bool]:
    """開始日は1日目。未来日は日数を出さない。"""
    if start > today:
        return None, True
    return (today - start).days + 1, False


def build_oshi_day_rows(
    *,
    names: list[str],
    saved: list[dict[str, Any]],
    today: date,
) -> list[dict[str, Any]]:
    by_name: dict[str, date | None] = {}
    for raw in names:
        try:
            key = normalize_character_name(raw)
        except ValueError:
            continue
        by_name.setdefault(key, None)
    for row in saved:
        if not isinstance(row, dict):
            continue
        try:
            key = normalize_character_name(row.get("character_name"))
        except ValueError:
            continue
        by_name[key] = _parse_date(row.get("start_date"))
    out: list[dict[str, Any]] = []
    for name, start in by_name.items():
        if start is None:
            out.append(
                {
                    "character_name": name,
                    "start_date": None,
                    "day_count": None,
                    "is_future": False,
                }
            )
            continue
        count, future = oshi_day_count(start, today)
        out.append(
            {
                "character_name": name,
                "start_date": start.isoformat(),
                "day_count": count,
                "is_future": future,
            }
        )
    out.sort(
        key=lambda row: (
            row["start_date"] is None,
            -(row["day_count"] or 0),
            str(row["character_name"]),
        )
    )
    return out


def list_oshi_day_rows(*, members_id: str, access_token: str) -> list[dict[str, Any]]:
    if not str(members_id or "").strip() or not str(access_token or "").strip():
        return []
    client = create_user_client(str(access_token).strip())
    resp = (
        client.table("oshi_day")
        .select("character_name,start_date")
        .eq("members_id", str(members_id).strip())
        .execute()
    )
    return [row for row in (resp.data or []) if isinstance(row, dict)]


def upsert_oshi_day(
    *,
    members_id: str,
    access_token: str,
    character_name: str,
    start_date: str,
) -> dict[str, Any]:
    if not str(members_id or "").strip() or not str(access_token or "").strip():
        raise ValueError("members_id が空です")
    name = normalize_character_name(character_name)
    parsed = _parse_date(start_date)
    if parsed is None:
        raise ValueError("開始日を入力してください")
    client = create_user_client(str(access_token).strip())
    payload = {
        "members_id": str(members_id).strip(),
        "character_name": name,
        "start_date": parsed.isoformat(),
    }
    resp = (
        client.table("oshi_day")
        .upsert(payload, on_conflict="members_id,character_name")
        .execute()
    )
    if getattr(resp, "error", None):
        logger.exception("推し何日目の保存に失敗: %s", resp.error)
        raise RuntimeError("推し何日目の保存に失敗しました")
    return {"character_name": name, "start_date": parsed.isoformat()}


def delete_oshi_day(
    *,
    members_id: str,
    access_token: str,
    character_name: str,
) -> bool:
    if not str(members_id or "").strip() or not str(access_token or "").strip():
        raise ValueError("members_id が空です")
    name = normalize_character_name(character_name)
    client = create_user_client(str(access_token).strip())
    (
        client.table("oshi_day")
        .delete()
        .eq("members_id", str(members_id).strip())
        .eq("character_name", name)
        .execute()
    )
    return True
