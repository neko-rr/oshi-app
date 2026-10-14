"""グッズの色の件数。カラータグ集計とは別。"""

from __future__ import annotations

import logging
from typing import Any

from app.infra.supabase_user import create_user_client
from app.services.product_color import (
    build_product_color_share,
    coerce_product_color_codes,
)

logger = logging.getLogger(__name__)


def fetch_product_color_share(*, members_id: str, access_token: str) -> dict[str, Any]:
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    if not access_token or not str(access_token).strip():
        raise ValueError("access_token が空です")
    client = create_user_client(access_token)
    code_lists: list[list[str]] = []
    offset = 0
    page = 1000
    while offset < 20000:
        resp = (
            client.table("registered_product")
            .select("product_color_codes")
            .eq("members_id", members_id)
            .range(offset, offset + page - 1)
            .execute()
        )
        batch = [row for row in (resp.data or []) if isinstance(row, dict)]
        for row in batch:
            code_lists.append(coerce_product_color_codes(row.get("product_color_codes")))
        if len(batch) < page:
            break
        offset += page
    count_resp = (
        client.table("registered_product")
        .select("registered_product_id", count="exact", head=True)
        .eq("members_id", members_id)
        .execute()
    )
    product_total = int(getattr(count_resp, "count", None) or len(code_lists))
    return build_product_color_share(
        code_lists=code_lists,
        product_total=product_total,
    )
