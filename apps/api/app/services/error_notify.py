"""未処理例外を任意の HTTPS webhook へ1件通知する。未設定なら何もしない。"""

from __future__ import annotations

import json
import logging
import re
import urllib.error
import urllib.request
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)

_BEARER = re.compile(r"(?i)bearer\s+\S+")
_ASSIGNED_SECRET = re.compile(
    r"(?i)\b(token|secret|password|authorization)\s*[:=]\s*\S+"
)


def scrub_notice_text(text: str) -> str:
    """通知文から資格情報らしい断片を落とす。"""
    cleaned = _BEARER.sub("bearer [redacted]", text)
    cleaned = _ASSIGNED_SECRET.sub(r"\1=[redacted]", cleaned)
    return cleaned[:300]


def build_error_notice(*, method: str, path: str, exc: BaseException) -> dict[str, str]:
    """クエリもリクエスト本体も載せない。"""
    bare_path = path.split("?", 1)[0]
    return {
        "source": "oshihaven-api",
        "method": method.strip() or "GET",
        "path": bare_path or "/",
        "error_type": type(exc).__name__,
        "message": scrub_notice_text(str(exc)),
    }


def notify_unhandled_error(
    *,
    webhook_url: str,
    notice: dict[str, Any],
    post: Callable[[str, dict[str, Any]], None] | None = None,
) -> bool:
    """URL が https のときだけ送る。失敗しても呼び出し元は落とさない。"""
    url = webhook_url.strip()
    if not url:
        return False
    if not url.startswith("https://"):
        logger.warning("ERROR_NOTIFY_WEBHOOK_URL は https 以外を無視しました")
        return False
    sender = post or _post_json
    try:
        sender(url, notice)
    except Exception:
        logger.exception("エラー通知の送信に失敗")
        return False
    return True


def _post_json(url: str, body: dict[str, Any]) -> None:
    data = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=3) as response:
            response.read()
    except urllib.error.HTTPError as exc:
        # 受信側の 4xx/5xx はアプリ本体の失敗にしない
        logger.warning("エラー通知が拒否されました status=%s", exc.code)
