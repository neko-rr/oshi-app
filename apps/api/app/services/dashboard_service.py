"""ダッシュボード RPC ラッパ。"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.infra.supabase_user import create_user_client
from app.services.color_tag_analytics_service import fetch_color_tag_share

logger = logging.getLogger(__name__)


def empty_collection_summary() -> dict[str, Any]:
    return {
        "product_count": 0,
        "want_object_count": 0,
        "sales_desired_count": 0,
        "categories": [],
        "uncategorized_count": 0,
        "storage_locations": [],
        "unstored_count": 0,
        "spend_by_currency": [],
        "unpriced_count": 0,
        "missing_photo_count": 0,
        "duplicate_barcode_count": 0,
        "spend_months": [],
        "undated_item_count": 0,
        "undated_spend": [],
        "current_month": None,
    }


def empty_dashboard() -> dict[str, Any]:
    return {
        "spend_series": [],
        "product_mix": [],
        "category_tags": [],
        "storage_locations": [],
        "color_tags": [],
        "meta": {},
        "collection": empty_collection_summary(),
        "budgets": [],
        "oshi_days": [],
    }


def _parse(raw: Any) -> dict[str, Any] | None:
    if raw is None:
        return None
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except Exception:
            return None
    return raw if isinstance(raw, dict) else None


def fetch_dashboard_charts(
    *,
    access_token: str,
    members_id: str | None = None,
    granularity: str = "month",
    daily_limit: int = 90,
) -> dict[str, Any]:
    base = empty_dashboard()
    gran = (granularity or "month").strip().lower()
    if gran not in ("month", "day"):
        gran = "month"
    lim = max(1, min(int(daily_limit or 90), 366))
    try:
        client = create_user_client(access_token)
        rpc = client.rpc(
            "app_dashboard_charts",
            {"p_granularity": gran, "p_daily_limit": lim},
        ).execute()
        parsed = _parse(rpc.data if hasattr(rpc, "data") else None)
        if parsed:
            for k in base:
                if k in parsed:
                    base[k] = parsed[k]
    except Exception:
        logger.exception("dashboard charts RPC 失敗")
    if members_id:
        try:
            share = fetch_color_tag_share(
                members_id=members_id, access_token=access_token
            )
            base["color_tags"] = share["items"]
            meta = dict(base.get("meta") or {})
            if not isinstance(meta, dict):
                meta = {}
            meta["color_tag_assignment_total"] = share["assignment_total"]
            meta["color_tag_product_total"] = share["product_total"]
            meta["color_tag_untagged_count"] = share["untagged_count"]
            base["meta"] = meta
        except Exception:
            logger.exception("カラータグ割合の集計に失敗")
    if members_id:
        today = _calendar_today(_timezone_override(members_id, access_token))
        try:
            summary = fetch_collection_summary(
                members_id=members_id,
                access_token=access_token,
                today=today,
            )
            names = summary.pop("character_names", [])
            base["collection"] = summary
        except Exception:
            logger.exception("コレクション集計に失敗")
            base["collection"] = empty_collection_summary()
            names = []
            summary = base["collection"]
        try:
            from app.services.oshi_day_service import (
                build_oshi_day_rows,
                list_oshi_day_rows,
            )

            base["oshi_days"] = build_oshi_day_rows(
                names=list(names),
                saved=list_oshi_day_rows(
                    members_id=members_id, access_token=access_token
                ),
                today=today,
            )
        except Exception:
            logger.exception("推し何日目の取得に失敗")
            base["oshi_days"] = []
        try:
            from app.services.spending_budget_service import (
                build_budget_status,
                list_spending_budget_rows,
            )

            month = summary.get("current_month")
            month_spend: list[dict[str, Any]] = []
            for row in summary.get("spend_months") or []:
                if isinstance(row, dict) and row.get("month") == month:
                    raw_spend = row.get("spend_by_currency") or []
                    if isinstance(raw_spend, list):
                        month_spend = [item for item in raw_spend if isinstance(item, dict)]
            base["budgets"] = build_budget_status(
                spent_rows=month_spend,
                budgets=list_spending_budget_rows(
                    members_id=members_id, access_token=access_token
                ),
            )
        except Exception:
            logger.exception("支出予算の取得に失敗")
            base["budgets"] = []
    return base


def _timezone_override(members_id: str, access_token: str) -> str | None:
    try:
        from app.services.display_settings_service import get_display_settings

        prefs = get_display_settings(
            members_id=members_id, access_token=access_token
        )
    except Exception:
        logger.info("表示タイムゾーンを読めません")
        return None
    tz = prefs.get("timezone_override") if isinstance(prefs, dict) else None
    return str(tz).strip() if isinstance(tz, str) and tz.strip() else None


def _calendar_today(tz_name: str | None):
    from datetime import datetime
    from zoneinfo import ZoneInfo

    name = tz_name or "Asia/Tokyo"
    try:
        return datetime.now(ZoneInfo(name)).date()
    except Exception:
        return datetime.now(ZoneInfo("Asia/Tokyo")).date()


def _flag_on(raw: Any) -> bool:
    try:
        return int(raw) == 1
    except (TypeError, ValueError):
        return False


def _as_int(raw: Any) -> int | None:
    if isinstance(raw, bool) or raw is None:
        return None
    if isinstance(raw, int):
        return raw
    if isinstance(raw, float) and raw.is_integer():
        return int(raw)
    if isinstance(raw, str):
        text = raw.strip()
        if text.lstrip("-").isdigit():
            return int(text)
    return None


def _positive_id(raw: Any) -> int | None:
    n = _as_int(raw)
    if n is None or n < 1:
        return None
    return n


def _currency_label(raw: Any) -> str | None:
    if raw is None:
        return None
    text = str(raw).strip().upper()
    if not text:
        return None
    from app.services.currency_codes import normalize_currency_code

    try:
        return normalize_currency_code(text)
    except ValueError:
        return text[:8]


def _share(count: int, total: int) -> float:
    if total <= 0 or count <= 0:
        return 0.0
    return round(count / total, 4)


def _month_key(raw: Any) -> str | None:
    if raw is None:
        return None
    text = str(raw).strip()
    if len(text) >= 10:
        text = text[:10]
    try:
        from datetime import datetime

        datetime.strptime(text, "%Y-%m-%d")
    except ValueError:
        return None
    return text[:7]


def _character_name(raw: Any) -> str | None:
    import unicodedata

    text = unicodedata.normalize("NFKC", str(raw or ""))
    name = " ".join(text.split())
    if not name:
        return None
    return name[:80]


def _spend_rows(
    totals: dict[str | None, int], counts: dict[str | None, int]
) -> list[dict[str, Any]]:
    rows = [
        {
            "currency_code": code,
            "total": totals[code],
            "priced_count": counts[code],
        }
        for code in totals
    ]
    rows.sort(key=lambda row: (row["currency_code"] is None, row["currency_code"] or ""))
    return rows


def build_collection_summary(
    *,
    products: list[dict[str, Any]],
    categories: list[dict[str, Any]],
    storage_locations: list[dict[str, Any]],
    today: Any = None,
) -> dict[str, Any]:
    """所持数・内訳・通貨別支出。通貨は合計しない。"""
    cat_names: dict[int, str] = {}
    for row in categories:
        cid = _positive_id(row.get("category_tag_id"))
        if cid is None:
            continue
        cat_names[cid] = str(row.get("category_tag_name") or "").strip()
    storage_names: dict[int, str] = {}
    storage_caps: dict[int, int | None] = {}
    for row in storage_locations:
        sid = _positive_id(row.get("storage_location_id"))
        if sid is None:
            continue
        storage_names[sid] = str(row.get("storage_location_name") or "").strip()
        cap = _as_int(row.get("storage_count_per_1"))
        storage_caps[sid] = cap if cap is not None and cap >= 1 else None

    product_count = 0
    want_count = 0
    sales_count = 0
    uncategorized = 0
    unstored = 0
    unpriced = 0
    cat_counts: dict[int, int] = {}
    storage_counts: dict[int, int] = {}
    spend_totals: dict[str | None, int] = {}
    spend_counts: dict[str | None, int] = {}
    month_items: dict[str, int] = {}
    month_totals: dict[str, dict[str | None, int]] = {}
    month_priced: dict[str, dict[str | None, int]] = {}
    undated_items = 0
    undated_totals: dict[str | None, int] = {}
    undated_priced: dict[str | None, int] = {}
    character_names: set[str] = set()
    missing_photo = 0
    barcode_keys: list[str] = []

    for row in products:
        if not isinstance(row, dict):
            continue
        product_count += 1
        if _flag_on(row.get("want_object_flag")):
            want_count += 1
        if _flag_on(row.get("sales_desired_flag")):
            sales_count += 1
        cid = _positive_id(row.get("category_tag_id"))
        if cid is None or cid not in cat_names:
            uncategorized += 1
        else:
            cat_counts[cid] = cat_counts.get(cid, 0) + 1
        sid = _positive_id(row.get("storage_location_id"))
        if sid is None or sid not in storage_names:
            unstored += 1
        else:
            storage_counts[sid] = storage_counts.get(sid, 0) + 1
        character = _character_name(row.get("character_name"))
        if character:
            character_names.add(character)
        if _positive_id(row.get("photo_id")) is None:
            missing_photo += 1
        barcode_key = str(row.get("barcode_number") or "").strip()
        if barcode_key:
            barcode_keys.append(barcode_key)
        month = _month_key(row.get("purchase_date"))
        if month:
            month_items[month] = month_items.get(month, 0) + 1
        else:
            undated_items += 1
        price = _as_int(row.get("purchase_price"))
        if price is None:
            unpriced += 1
            continue
        code = _currency_label(row.get("currency_code"))
        spend_totals[code] = spend_totals.get(code, 0) + price
        spend_counts[code] = spend_counts.get(code, 0) + 1
        if month:
            bucket_totals = month_totals.setdefault(month, {})
            bucket_counts = month_priced.setdefault(month, {})
        else:
            bucket_totals = undated_totals
            bucket_counts = undated_priced
        bucket_totals[code] = bucket_totals.get(code, 0) + price
        bucket_counts[code] = bucket_counts.get(code, 0) + 1

    categories_out = [
        {
            "category_tag_id": cid,
            "name": cat_names.get(cid, ""),
            "count": count,
            "share": _share(count, product_count),
        }
        for cid, count in cat_counts.items()
        if count > 0
    ]
    categories_out.sort(key=lambda row: (-int(row["count"]), int(row["category_tag_id"])))
    storage_out = []
    for sid, count in storage_counts.items():
        if count <= 0:
            continue
        cap = storage_caps.get(sid)
        storage_out.append(
            {
                "storage_location_id": sid,
                "name": storage_names.get(sid, ""),
                "count": count,
                "share": _share(count, product_count),
                "capacity_count": cap,
                "remaining": None if cap is None else cap - count,
            }
        )
    storage_out.sort(
        key=lambda row: (-int(row["count"]), int(row["storage_location_id"]))
    )
    barcode_counts: dict[str, int] = {}
    for key in barcode_keys:
        barcode_counts[key] = barcode_counts.get(key, 0) + 1
    duplicate_keys = {key for key, count in barcode_counts.items() if count >= 2}
    duplicate_barcode_count = sum(1 for key in barcode_keys if key in duplicate_keys)
    spend_out = _spend_rows(spend_totals, spend_counts)
    months = sorted(month_items.keys(), reverse=True)[:12]
    current = _month_key(today) if today is not None else None
    return {
        "product_count": product_count,
        "want_object_count": want_count,
        "sales_desired_count": sales_count,
        "categories": categories_out,
        "uncategorized_count": uncategorized,
        "storage_locations": storage_out,
        "unstored_count": unstored,
        "spend_by_currency": spend_out,
        "unpriced_count": unpriced,
        "missing_photo_count": missing_photo,
        "duplicate_barcode_count": duplicate_barcode_count,
        "spend_months": [
            {
                "month": month,
                "item_count": month_items[month],
                "spend_by_currency": _spend_rows(
                    month_totals.get(month, {}), month_priced.get(month, {})
                ),
            }
            for month in months
        ],
        "undated_item_count": undated_items,
        "undated_spend": _spend_rows(undated_totals, undated_priced),
        "current_month": current,
        "character_names": sorted(character_names),
    }


def _fetch_member_rows(
    client: Any,
    *,
    table: str,
    columns: str,
    members_id: str,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = 0
    page = 1000
    while offset < 20000:
        resp = (
            client.table(table)
            .select(columns)
            .eq("members_id", members_id)
            .range(offset, offset + page - 1)
            .execute()
        )
        batch = [row for row in (resp.data or []) if isinstance(row, dict)]
        rows.extend(batch)
        if len(batch) < page:
            break
        offset += page
    return rows


def fetch_collection_summary(
    *, members_id: str, access_token: str, today: Any = None
) -> dict[str, Any]:
    if not str(members_id or "").strip() or not str(access_token or "").strip():
        return empty_collection_summary()
    client = create_user_client(str(access_token).strip())
    mid = str(members_id).strip()
    products = _fetch_member_rows(
        client,
        table="registered_product",
        columns=(
            "purchase_price,currency_code,purchase_date,character_name,"
            "category_tag_id,storage_location_id,sales_desired_flag,want_object_flag,"
            "photo_id,barcode_number"
        ),
        members_id=mid,
    )
    categories = _fetch_member_rows(
        client,
        table="category_tag",
        columns="category_tag_id,category_tag_name",
        members_id=mid,
    )
    storage_locations = _fetch_member_rows(
        client,
        table="storage_location",
        columns="storage_location_id,storage_location_name,storage_count_per_1",
        members_id=mid,
    )
    return build_collection_summary(
        products=products,
        categories=categories,
        storage_locations=storage_locations,
        today=today,
    )
