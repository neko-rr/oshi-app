"""ユーザー別表示設定（display_settings）。"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError, available_timezones

from app.infra.supabase_user import create_user_client
from app.services.currency_codes import (
    ALLOWED_CURRENCY_CODE,
    normalize_currency_code,
)

logger = logging.getLogger(__name__)

DEFAULT_MEMBERS_TYPE_NAME = "default"

DEFAULT_TEXT_SCALE = 3
DEFAULT_UI_DENSITY = 4
DEFAULT_LIST_SORT = "newest"
DEFAULT_GALLERY_LAYOUT = "grid"
DEFAULT_LANDING_PAGE = "home"
DEFAULT_RESIDENCE_REGION = "jp"
DEFAULT_DATE_FORMAT_MODE = "residence"

MIN_LEVEL = 1
MAX_LEVEL = 7

ALLOWED_LIST_SORT = frozenset({"newest", "name", "created_at"})
ALLOWED_GALLERY_LAYOUT = frozenset({"grid", "large", "list"})
ALLOWED_LANDING_PAGE = frozenset({"home", "gallery", "register"})
# Web residencePrefs.RESIDENCE_REGIONS と揃える（大陸別カタログ）
ALLOWED_RESIDENCE_REGION = frozenset(
    {
        "jp",
        "kr",
        "tw",
        "cn",
        "hk",
        "sg",
        "th",
        "vn",
        "id",
        "my",
        "ph",
        "in",
        "au",
        "nz",
        "us_pacific",
        "us_mountain",
        "us_central",
        "us_eastern",
        "ca_pacific",
        "ca_eastern",
        "mx",
        "br",
        "ar",
        "uk",
        "ie",
        "de",
        "fr",
        "it",
        "es",
        "nl",
        "se",
        "pl",
        "ch",
        "pt",
        "ru",
        "tr",
        "ae",
        "sa",
        "eg",
        "il",
        "za",
        "other",
    }
)
ALLOWED_DATE_FORMAT_MODE = frozenset({"residence", "ui_locale", "iso"})
DEFAULT_CURRENCY_FORMAT_MODE = "residence"
ALLOWED_CURRENCY_FORMAT_MODE = frozenset({"residence", "ui_locale", "plain"})
DEFAULT_REGISTER_START_STEP = "barcode"
ALLOWED_REGISTER_START_STEP = frozenset({"barcode", "photo", "confirm"})
DEFAULT_GALLERY_SHOW_NAME = True
DEFAULT_GALLERY_SHOW_TAGS = True
DEFAULT_GALLERY_SHOW_PRICE = True


@lru_cache(maxsize=1)
def _iana_timezones() -> frozenset[str]:
    zones = set(available_timezones())
    zones.add("UTC")
    return frozenset(zones)

SELECT_COLS = (
    "text_scale,ui_density,list_sort,gallery_layout,landing_page,"
    "residence_region,timezone_override,date_format_mode,"
    "currency_code_override,currency_format_mode,"
    "register_start_step,default_storage_location_id,"
    "gallery_show_name,gallery_show_tags,gallery_show_price"
)


def _normalize_level(value: int, *, field: str) -> int:
    if not isinstance(value, int) or isinstance(value, bool):
        raise ValueError(f"未対応の表示設定です（{field}）")
    if value < MIN_LEVEL or value > MAX_LEVEL:
        raise ValueError(f"未対応の表示設定です（{field}）")
    return value


def _normalize_choice(value: str, *, field: str, allowed: frozenset[str]) -> str:
    raw = (value or "").strip()
    if raw not in allowed:
        raise ValueError(f"未対応の表示設定です（{field}）")
    return raw


def _normalize_timezone_override(value: Any) -> str | None:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    if raw in _iana_timezones():
        return raw
    # available_timezones に無い環境向けの最終確認
    try:
        ZoneInfo(raw)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise ValueError("未対応の表示設定です（timezone_override）") from exc
    return raw


def _normalize_currency_code_override(value: Any) -> str | None:
    try:
        return normalize_currency_code(value, field="currency_code_override")
    except ValueError as exc:
        raise ValueError("未対応の表示設定です（currency_code_override）") from exc


def _normalize_default_storage_location_id(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, str) and not value.strip():
        return None
    try:
        n = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            "未対応の表示設定です（default_storage_location_id）"
        ) from exc
    if n < 1:
        raise ValueError("未対応の表示設定です（default_storage_location_id）")
    return n


def _normalize_bool(value: Any, *, field: str) -> bool:
    if not isinstance(value, bool):
        raise ValueError(f"未対応の表示設定です（{field}）")
    return value


def _gallery_show_from_row(row: dict[str, Any], *, key: str, default: bool) -> bool:
    if key not in row or row.get(key) is None:
        return default
    try:
        return _normalize_bool(row.get(key), field=key)
    except ValueError:
        return default


def _assert_owned_storage_location(
    *,
    client: Any,
    members_id: str,
    storage_location_id: int,
) -> None:
    resp = (
        client.table("storage_location")
        .select("storage_location_id")
        .eq("members_id", members_id)
        .eq("storage_location_id", storage_location_id)
        .limit(1)
        .execute()
    )
    rows: list[dict[str, Any]] = list(resp.data or [])
    if not rows:
        raise ValueError("未対応の表示設定です（default_storage_location_id）")


def _row_or_defaults(row: dict[str, Any] | None) -> dict[str, Any]:
    if not row:
        return {
            "text_scale": DEFAULT_TEXT_SCALE,
            "ui_density": DEFAULT_UI_DENSITY,
            "list_sort": DEFAULT_LIST_SORT,
            "gallery_layout": DEFAULT_GALLERY_LAYOUT,
            "landing_page": DEFAULT_LANDING_PAGE,
            "residence_region": DEFAULT_RESIDENCE_REGION,
            "timezone_override": None,
            "date_format_mode": DEFAULT_DATE_FORMAT_MODE,
            "currency_code_override": None,
            "currency_format_mode": DEFAULT_CURRENCY_FORMAT_MODE,
            "register_start_step": DEFAULT_REGISTER_START_STEP,
            "default_storage_location_id": None,
            "gallery_show_name": DEFAULT_GALLERY_SHOW_NAME,
            "gallery_show_tags": DEFAULT_GALLERY_SHOW_TAGS,
            "gallery_show_price": DEFAULT_GALLERY_SHOW_PRICE,
        }
    try:
        text_scale = _normalize_level(int(row.get("text_scale")), field="text_scale")
    except (TypeError, ValueError):
        text_scale = DEFAULT_TEXT_SCALE
    try:
        ui_density = _normalize_level(int(row.get("ui_density")), field="ui_density")
    except (TypeError, ValueError):
        ui_density = DEFAULT_UI_DENSITY
    try:
        list_sort = _normalize_choice(
            str(row.get("list_sort") or ""),
            field="list_sort",
            allowed=ALLOWED_LIST_SORT,
        )
    except ValueError:
        list_sort = DEFAULT_LIST_SORT
    try:
        gallery_layout = _normalize_choice(
            str(row.get("gallery_layout") or ""),
            field="gallery_layout",
            allowed=ALLOWED_GALLERY_LAYOUT,
        )
    except ValueError:
        gallery_layout = DEFAULT_GALLERY_LAYOUT
    try:
        landing_page = _normalize_choice(
            str(row.get("landing_page") or ""),
            field="landing_page",
            allowed=ALLOWED_LANDING_PAGE,
        )
    except ValueError:
        landing_page = DEFAULT_LANDING_PAGE
    try:
        residence_region = _normalize_choice(
            str(row.get("residence_region") or ""),
            field="residence_region",
            allowed=ALLOWED_RESIDENCE_REGION,
        )
    except ValueError:
        residence_region = DEFAULT_RESIDENCE_REGION
    try:
        timezone_override = _normalize_timezone_override(row.get("timezone_override"))
    except ValueError:
        timezone_override = None
    try:
        date_format_mode = _normalize_choice(
            str(row.get("date_format_mode") or ""),
            field="date_format_mode",
            allowed=ALLOWED_DATE_FORMAT_MODE,
        )
    except ValueError:
        date_format_mode = DEFAULT_DATE_FORMAT_MODE
    try:
        currency_code_override = _normalize_currency_code_override(
            row.get("currency_code_override")
        )
    except ValueError:
        currency_code_override = None
    try:
        currency_format_mode = _normalize_choice(
            str(row.get("currency_format_mode") or ""),
            field="currency_format_mode",
            allowed=ALLOWED_CURRENCY_FORMAT_MODE,
        )
    except ValueError:
        currency_format_mode = DEFAULT_CURRENCY_FORMAT_MODE
    try:
        register_start_step = _normalize_choice(
            str(row.get("register_start_step") or ""),
            field="register_start_step",
            allowed=ALLOWED_REGISTER_START_STEP,
        )
    except ValueError:
        register_start_step = DEFAULT_REGISTER_START_STEP
    try:
        default_storage_location_id = _normalize_default_storage_location_id(
            row.get("default_storage_location_id")
        )
    except ValueError:
        default_storage_location_id = None
    gallery_show_name = _gallery_show_from_row(
        row, key="gallery_show_name", default=DEFAULT_GALLERY_SHOW_NAME
    )
    gallery_show_tags = _gallery_show_from_row(
        row, key="gallery_show_tags", default=DEFAULT_GALLERY_SHOW_TAGS
    )
    gallery_show_price = _gallery_show_from_row(
        row, key="gallery_show_price", default=DEFAULT_GALLERY_SHOW_PRICE
    )
    return {
        "text_scale": text_scale,
        "ui_density": ui_density,
        "list_sort": list_sort,
        "gallery_layout": gallery_layout,
        "landing_page": landing_page,
        "residence_region": residence_region,
        "timezone_override": timezone_override,
        "date_format_mode": date_format_mode,
        "currency_code_override": currency_code_override,
        "currency_format_mode": currency_format_mode,
        "register_start_step": register_start_step,
        "default_storage_location_id": default_storage_location_id,
        "gallery_show_name": gallery_show_name,
        "gallery_show_tags": gallery_show_tags,
        "gallery_show_price": gallery_show_price,
    }


def get_display_settings(*, members_id: str, access_token: str) -> dict[str, Any]:
    client = create_user_client(access_token)
    resp = (
        client.table("display_settings")
        .select(SELECT_COLS)
        .eq("members_id", members_id)
        .eq("members_type_name", DEFAULT_MEMBERS_TYPE_NAME)
        .limit(1)
        .execute()
    )
    rows: list[dict[str, Any]] = list(resp.data or [])
    return _row_or_defaults(rows[0] if rows else None)


def save_display_settings(
    *,
    members_id: str,
    access_token: str,
    text_scale: int,
    ui_density: int,
    list_sort: str,
    gallery_layout: str,
    landing_page: str,
    residence_region: str,
    timezone_override: str | None,
    date_format_mode: str,
    currency_code_override: str | None,
    currency_format_mode: str,
    register_start_step: str,
    default_storage_location_id: int | None,
    gallery_show_name: bool,
    gallery_show_tags: bool,
    gallery_show_price: bool,
) -> dict[str, Any]:
    default_storage = _normalize_default_storage_location_id(
        default_storage_location_id
    )
    payload = {
        "members_id": members_id,
        "members_type_name": DEFAULT_MEMBERS_TYPE_NAME,
        "text_scale": _normalize_level(text_scale, field="text_scale"),
        "ui_density": _normalize_level(ui_density, field="ui_density"),
        "list_sort": _normalize_choice(
            list_sort, field="list_sort", allowed=ALLOWED_LIST_SORT
        ),
        "gallery_layout": _normalize_choice(
            gallery_layout, field="gallery_layout", allowed=ALLOWED_GALLERY_LAYOUT
        ),
        "landing_page": _normalize_choice(
            landing_page, field="landing_page", allowed=ALLOWED_LANDING_PAGE
        ),
        "residence_region": _normalize_choice(
            residence_region,
            field="residence_region",
            allowed=ALLOWED_RESIDENCE_REGION,
        ),
        "timezone_override": _normalize_timezone_override(timezone_override),
        "date_format_mode": _normalize_choice(
            date_format_mode,
            field="date_format_mode",
            allowed=ALLOWED_DATE_FORMAT_MODE,
        ),
        "currency_code_override": _normalize_currency_code_override(
            currency_code_override
        ),
        "currency_format_mode": _normalize_choice(
            currency_format_mode,
            field="currency_format_mode",
            allowed=ALLOWED_CURRENCY_FORMAT_MODE,
        ),
        "register_start_step": _normalize_choice(
            register_start_step,
            field="register_start_step",
            allowed=ALLOWED_REGISTER_START_STEP,
        ),
        "default_storage_location_id": default_storage,
        "gallery_show_name": _normalize_bool(
            gallery_show_name, field="gallery_show_name"
        ),
        "gallery_show_tags": _normalize_bool(
            gallery_show_tags, field="gallery_show_tags"
        ),
        "gallery_show_price": _normalize_bool(
            gallery_show_price, field="gallery_show_price"
        ),
    }
    client = create_user_client(access_token)
    if default_storage is not None:
        _assert_owned_storage_location(
            client=client,
            members_id=members_id,
            storage_location_id=default_storage,
        )
    client.table("display_settings").upsert(
        payload, on_conflict="members_id,members_type_name"
    ).execute()
    return {
        "text_scale": payload["text_scale"],
        "ui_density": payload["ui_density"],
        "list_sort": payload["list_sort"],
        "gallery_layout": payload["gallery_layout"],
        "landing_page": payload["landing_page"],
        "residence_region": payload["residence_region"],
        "timezone_override": payload["timezone_override"],
        "date_format_mode": payload["date_format_mode"],
        "currency_code_override": payload["currency_code_override"],
        "currency_format_mode": payload["currency_format_mode"],
        "register_start_step": payload["register_start_step"],
        "default_storage_location_id": payload["default_storage_location_id"],
        "gallery_show_name": payload["gallery_show_name"],
        "gallery_show_tags": payload["gallery_show_tags"],
        "gallery_show_price": payload["gallery_show_price"],
    }
