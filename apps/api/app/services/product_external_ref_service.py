"""製品の外部マーケット参照（楽天・任意URL）。"""

from __future__ import annotations

import logging
from typing import Any, Callable
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

ALLOWED_SOURCES = frozenset({"rakuten", "amazon", "manual"})


def _clean_text(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned or None


def _validate_http_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("product_url は http(s) のURLである必要があります")
    return url


def validate_external_ref(raw: dict[str, Any]) -> dict[str, Any]:
    """1件の外部参照を検証・正規化する。"""
    if not isinstance(raw, dict):
        raise ValueError("external_refs の要素が不正です")
    source = _clean_text(raw.get("source"))
    if not source or source not in ALLOWED_SOURCES:
        raise ValueError("source は rakuten / amazon / manual のいずれかです")

    product_url = _clean_text(raw.get("product_url"))
    if not product_url:
        raise ValueError("product_url は必須です")
    product_url = _validate_http_url(product_url)

    external_item_code = _clean_text(raw.get("external_item_code"))
    shop_name = _clean_text(raw.get("shop_name"))
    label = _clean_text(raw.get("label"))
    is_primary = bool(raw.get("is_primary"))

    if source == "rakuten":
        if not external_item_code or not shop_name:
            raise ValueError(
                "楽天参照には external_item_code と shop_name が必須です"
            )
    if source == "amazon":
        # 将来用。現状は url のみ必須（コードは任意）
        pass
    if source == "manual":
        external_item_code = None

    return {
        "source": source,
        "product_url": product_url,
        "external_item_code": external_item_code,
        "shop_name": shop_name,
        "label": label,
        "is_primary": is_primary,
    }


def normalize_external_refs(
    raws: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    """複数参照を検証し、source 重複を禁止、主リンクは先頭優先で1つ。"""
    if not raws:
        return []
    if not isinstance(raws, list):
        raise ValueError("external_refs は配列である必要があります")
    if len(raws) > 3:
        raise ValueError("external_refs は最大3件です")

    cleaned: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw in raws:
        item = validate_external_ref(raw)
        if item["source"] in seen:
            raise ValueError(f"source={item['source']} が重複しています")
        seen.add(item["source"])
        cleaned.append(item)

    primary_idx = next(
        (i for i, r in enumerate(cleaned) if r["is_primary"]),
        0 if cleaned else None,
    )
    for i, r in enumerate(cleaned):
        r["is_primary"] = i == primary_idx
    return cleaned


def list_external_refs_for_product(
    *,
    members_id: str,
    access_token: str,
    registered_product_id: int,
    fetch_rows: Callable[..., list[dict[str, Any]]] | None = None,
) -> list[dict[str, Any]]:
    fetcher = fetch_rows
    if fetcher is None:
        from app.infra.supabase_user import fetch_product_external_refs

        fetcher = fetch_product_external_refs
    return fetcher(
        members_id=members_id,
        access_token=access_token,
        registered_product_id=registered_product_id,
    )


def replace_external_refs_for_product(
    *,
    members_id: str,
    access_token: str,
    registered_product_id: int,
    refs: list[dict[str, Any]] | None,
    replace_rows: Callable[..., list[dict[str, Any]]] | None = None,
) -> list[dict[str, Any]]:
    """製品の外部参照を全置換（空配列なら全削除）。"""
    cleaned = normalize_external_refs(refs)
    replacer = replace_rows
    if replacer is None:
        from app.infra.supabase_user import replace_product_external_refs

        replacer = replace_product_external_refs
    try:
        return replacer(
            members_id=members_id,
            access_token=access_token,
            registered_product_id=registered_product_id,
            refs=cleaned,
        )
    except Exception:
        logger.exception("外部参照の保存に失敗")
        raise
