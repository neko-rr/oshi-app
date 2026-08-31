"""Storage bucket photos へのアップロードと photo 行の作成。"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from app.infra.supabase_user import create_user_client

logger = logging.getLogger(__name__)

_BUCKET = "photos"


def persist_photo_upload(
    *,
    members_id: str,
    access_token: str,
    file_bytes: bytes,
    content_type: str,
    filename: str,
) -> dict[str, Any]:
    """DB に仮行 → Storage アップロード → パス更新。object_path を返す。"""
    client = create_user_client(access_token)
    ext = (filename or "jpg").rsplit(".", 1)[-1].lower() or "jpg"
    if len(ext) > 8:
        ext = "jpg"
    object_path = f"{members_id}/{uuid.uuid4()}.{ext}"

    insert = (
        client.table("photo")
        .insert(
            {
                "members_id": members_id,
                "photo_thumbnail_url": object_path,
                "photo_high_resolution_url": object_path,
                "front_flag": 1,
            }
        )
        .execute()
    )
    if getattr(insert, "error", None):
        logger.error("photo insert error: %s", insert.error)
        raise RuntimeError("写真レコードの挿入に失敗しました")
    data = insert.data if hasattr(insert, "data") else None
    if not data or not isinstance(data, list) or not data[0].get("photo_id"):
        raise RuntimeError("写真レコードの挿入に失敗しました")
    photo_id = int(data[0]["photo_id"])

    try:
        client.storage.from_(_BUCKET).upload(
            object_path,
            file_bytes,
            file_options={"content-type": content_type or f"image/{ext}"},
        )
    except Exception:
        logger.exception("Storage アップロード失敗 photo_id=%s", photo_id)
        raise RuntimeError("画像のアップロードに失敗しました") from None

    return {"photo_id": photo_id, "object_path": object_path}
