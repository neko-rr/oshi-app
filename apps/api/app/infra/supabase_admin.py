"""Supabase Admin（secret key）専用。通常 CRUD には使わない。"""

from __future__ import annotations

import logging
from typing import Any

from app.core.settings import get_settings

logger = logging.getLogger(__name__)

_PHOTOS_BUCKET = "photos"
_EXPORTS_BUCKET = "exports"
_STORAGE_PAGE = 100


class AdminNotConfiguredError(RuntimeError):
    """SUPABASE_SECRET_KEY または URL が未設定。"""


def create_admin_client() -> Any:
    """secret key でクライアント生成。退会・管理操作専用。

    未設定時は AdminNotConfiguredError。
    """
    settings = get_settings()
    url = settings.supabase_url.strip().rstrip("/")
    key = settings.supabase_secret_key.strip()
    if url.lower().endswith("/rest/v1"):
        url = url[: -len("/rest/v1")].rstrip("/")
    if not url or not key:
        raise AdminNotConfiguredError("supabase_admin_not_configured")

    try:
        from supabase import create_client
        from supabase.lib.client_options import SyncClientOptions
    except ImportError as exc:  # pragma: no cover
        raise AdminNotConfiguredError("supabase_admin_not_configured") from exc

    return create_client(url, key, options=SyncClientOptions())


def _assert_safe_members_id(members_id: str) -> str:
    mid = (members_id or "").strip()
    if not mid or "/" in mid or "\\" in mid or ".." in mid:
        raise ValueError("invalid members_id")
    return mid


def _list_object_names(client: Any, *, bucket: str, folder: str) -> list[str]:
    """フォルダ直下のオブジェクト名を全件取得（ページング）。"""
    names: list[str] = []
    offset = 0
    while True:
        try:
            rows = client.storage.from_(bucket).list(
                folder,
                {"limit": _STORAGE_PAGE, "offset": offset},
            )
        except Exception:
            logger.exception("Storage list 失敗: bucket=%s folder=%s", bucket, folder)
            raise RuntimeError("storage_purge_failed") from None
        if not rows:
            break
        batch = 0
        for row in rows:
            if not isinstance(row, dict):
                continue
            name = row.get("name")
            if isinstance(name, str) and name.strip():
                names.append(name.strip())
                batch += 1
        if batch < _STORAGE_PAGE:
            break
        offset += _STORAGE_PAGE
    return names


def purge_member_storage(members_id: str) -> None:
    """photos / exports の {members_id}/ 配下を削除する。"""
    folder = _assert_safe_members_id(members_id)
    client = create_admin_client()
    for bucket in (_PHOTOS_BUCKET, _EXPORTS_BUCKET):
        names = _list_object_names(client, bucket=bucket, folder=folder)
        if not names:
            continue
        paths = [f"{folder}/{name}" for name in names]
        # remove は一度に多すぎると失敗しうるので分割
        chunk = 50
        for i in range(0, len(paths), chunk):
            part = paths[i : i + chunk]
            try:
                client.storage.from_(bucket).remove(part)
            except Exception:
                logger.exception(
                    "Storage remove 失敗: bucket=%s count=%s", bucket, len(part)
                )
                raise RuntimeError("storage_purge_failed") from None


def delete_auth_user(members_id: str) -> None:
    """Auth Admin API でユーザーを削除する（DB は CASCADE）。"""
    uid = _assert_safe_members_id(members_id)
    client = create_admin_client()
    try:
        client.auth.admin.delete_user(uid)
    except AdminNotConfiguredError:
        raise
    except Exception:
        logger.exception("Auth delete_user 失敗")
        raise RuntimeError("auth_delete_failed") from None
