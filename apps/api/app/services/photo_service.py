"""写真ユースケース（Storage + photo テーブル。IO Vision は呼ばない）。"""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)

PersistPhoto = Callable[..., dict[str, Any]]


def create_photo_for_member(
    members_id: str,
    *,
    access_token: str,
    file_bytes: bytes,
    content_type: str,
    filename: str,
    persist: PersistPhoto | None = None,
) -> dict[str, Any]:
    """正面写真を1枚登録。Vision / LLM は行わない。"""
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")
    if not file_bytes:
        raise ValueError("画像ファイルが空です")

    worker = persist
    if worker is None:
        from app.infra.photo_storage import persist_photo_upload

        worker = persist_photo_upload

    try:
        saved = worker(
            members_id=str(members_id).strip(),
            access_token=str(access_token).strip(),
            file_bytes=file_bytes,
            content_type=content_type or "application/octet-stream",
            filename=filename or "upload.jpg",
        )
    except RuntimeError as exc:
        if str(exc) == "supabase_not_configured":
            raise ValueError(
                "Supabase が未設定です（API の SUPABASE_URL / PUBLISHABLE_KEY）"
            ) from exc
        logger.exception("写真登録に失敗")
        raise
    except Exception:
        logger.exception("写真登録でシステムエラー")
        raise

    photo_id = saved.get("photo_id")
    path = saved.get("object_path")
    if not isinstance(photo_id, int) or not isinstance(path, str) or not path:
        raise RuntimeError("写真登録に失敗しました")

    return {
        "photo_id": photo_id,
        "photo_thumbnail_path": path,
        "photo_high_resolution_path": path,
    }
