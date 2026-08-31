"""IO Chat Completions の共通呼び出し（主モデル → フォールバック）。"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.settings import get_settings

logger = logging.getLogger(__name__)


def model_chain(primary: str, fallback: str) -> list[str]:
    """重複を除いた呼び出し順（空は除外）。"""
    out: list[str] = []
    for name in (primary, fallback):
        cleaned = (name or "").strip()
        if cleaned and cleaned not in out:
            out.append(cleaned)
    return out


def post_chat_completions(
    *,
    messages: list[dict[str, Any]],
    max_tokens: int,
    models: list[str],
    log_label: str,
) -> dict[str, Any]:
    """モデルを順に試し、最初の成功 JSON を返す。

    戻り値:
      - ok: {"ok": True, "data": ..., "model": ...}
      - ng: {"ok": False, "message": ...}
    """
    if not models:
        return {"ok": False, "message": "呼び出し可能なモデルがありません。"}

    settings = get_settings()
    url = settings.io_intelligence_api_url.strip()
    headers = {
        "Authorization": f"Bearer {settings.io_intelligence_api_key.strip()}",
        "Content-Type": "application/json",
    }
    last_error = "IO 呼び出しに失敗しました。"

    for index, model in enumerate(models):
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
        }
        try:
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(url, json=payload, headers=headers)
            if resp.status_code >= 400:
                logger.warning(
                    "%s HTTP %s model=%s body=%s",
                    log_label,
                    resp.status_code,
                    model,
                    resp.text[:200],
                )
                last_error = f"{log_label} 呼び出しに失敗しました。"
                # 次の候補へ
                continue
            return {"ok": True, "data": resp.json(), "model": model}
        except Exception:
            logger.exception("%s 例外 model=%s", log_label, model)
            last_error = f"{log_label} 呼び出しでエラーが発生しました。"
            if index < len(models) - 1:
                continue
            return {"ok": False, "message": last_error}

    return {"ok": False, "message": last_error}


def content_from_completion(data: dict[str, Any]) -> str | None:
    """chat.completion レスポンスからテキストを取り出す。"""
    choices = data.get("choices") or []
    if not choices or not isinstance(choices[0], dict):
        return None
    msg = choices[0].get("message") or {}
    text = msg.get("content")
    if isinstance(text, list):
        text = "\n".join(
            str(part.get("text") or "") for part in text if isinstance(part, dict)
        )
    return text if isinstance(text, str) else None
