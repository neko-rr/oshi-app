"""Cloudflare Turnstile のサーバー検証。Secret は API env のみ。"""

from __future__ import annotations

import logging

import httpx

logger = logging.getLogger(__name__)

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_turnstile_token(token: str, secret: str) -> bool:
    """トークンを siteverify する。失敗時は False（トークンはログに出さない）。"""
    cleaned = token.strip()
    key = secret.strip()
    if not cleaned or not key:
        return False
    try:
        response = httpx.post(
            SITEVERIFY_URL,
            data={"secret": key, "response": cleaned},
            timeout=5.0,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        logger.warning("turnstile siteverify failed")
        return False
    return payload.get("success") is True
