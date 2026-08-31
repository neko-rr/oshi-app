"""Storage photos バケットの signed URL 生成。"""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any
from urllib.parse import quote

import httpx

from app.core.settings import get_settings

logger = logging.getLogger(__name__)

_BUCKET = "photos"
SignHttp = Callable[..., str | None]


def resolve_signed_url(
    path_or_url: str | None,
    *,
    access_token: str,
    expires_in: int = 3600,
    sign_http: SignHttp | None = None,
) -> str | None:
    """https ならそのまま。object path なら署名 URL を返す。失敗時は None。"""
    if not path_or_url or not str(path_or_url).strip():
        return None
    value = str(path_or_url).strip()
    if value.startswith("http://") or value.startswith("https://"):
        return value

    signer = sign_http or create_signed_url_for_object
    try:
        return signer(
            object_path=value.lstrip("/"),
            access_token=access_token,
            expires_in=expires_in,
        )
    except Exception:
        logger.exception("signed URL 生成に失敗 path=%s", value[:80])
        return None


def create_signed_url_for_object(
    *,
    object_path: str,
    access_token: str,
    expires_in: int = 3600,
) -> str | None:
    """POST /storage/v1/object/sign/photos/{path}（ユーザー JWT）。"""
    if not object_path or not access_token:
        return None

    settings = get_settings()
    base = settings.supabase_url.strip().rstrip("/")
    key = settings.supabase_publishable_key.strip()
    if base.lower().endswith("/rest/v1"):
        base = base[: -len("/rest/v1")].rstrip("/")
    if not base or not key:
        return None

    path = object_path.lstrip("/")
    # パス各セグメントをエンコード（/ は残す）
    encoded = "/".join(quote(seg, safe="") for seg in path.split("/"))
    url = f"{base}/storage/v1/object/sign/{_BUCKET}/{encoded}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": key,
        "Content-Type": "application/json",
    }
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json={"expiresIn": expires_in}, headers=headers)
        if resp.status_code >= 400:
            logger.warning(
                "signed URL HTTP %s body=%s",
                resp.status_code,
                (resp.text or "")[:200],
            )
            return None
        data: Any = resp.json() if resp.content else {}
        signed = (
            data.get("signedURL")
            or data.get("signedUrl")
            or data.get("signed_url")
        )
        if not isinstance(signed, str) or not signed:
            return None
        if signed.startswith("http"):
            return signed
        if signed.startswith("/object/"):
            signed = f"/storage/v1{signed}"
        elif not signed.startswith("/storage/"):
            signed = f"/storage/v1{signed if signed.startswith('/') else '/' + signed}"
        return f"{base}{signed}"
    except Exception:
        logger.exception("signed URL リクエスト失敗")
        return None
