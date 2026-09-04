"""データ書き出し用 manifest / CSV / ZIP 組み立て（スキーマ変化耐性）。"""

from __future__ import annotations

import csv
import io
import json
import zipfile
from datetime import datetime, timezone
from typing import Any

FORMAT_NAME = "oshi_collection_export"
FORMAT_VERSION = 1

PRODUCT_CORE_KEYS = frozenset(
    {
        "registered_product_id",
        "product_name",
        "barcode_number",
        "barcode_type",
        "product_group_name",
        "works_series_name",
        "title",
        "character_name",
        "purchase_price",
        "currency_code",
        "purchase_location",
        "memo",
        "creation_date",
        "updated_date",
        "photo_id",
        "category_tag_id",
        "storage_location_id",
        "category_tag_name",
        "storage_location_name",
        "color_tag_slots",
    }
)

CATEGORY_CORE_KEYS = frozenset(
    {
        "category_tag_id",
        "category_tag_name",
        "category_tag_color",
        "category_tag_icon",
        "slot",
        "display_order",
        "use_flag",
    }
)

STORAGE_CORE_KEYS = frozenset(
    {
        "storage_location_id",
        "storage_location_name",
        "storage_location_icon",
        "slot",
        "display_order",
        "use_flag",
    }
)

COLOR_CORE_KEYS = frozenset(
    {
        "color_tag_id",
        "color_tag_name",
        "color",
        "slot",
    }
)

PRODUCT_COLOR_CORE_KEYS = frozenset(
    {
        "registered_product_id",
        "slot",
        "color_tag_id",
    }
)

PHOTO_CORE_KEYS = frozenset(
    {
        "photo_id",
        "photo_thumbnail_path",
        "photo_high_resolution_path",
        "media_path",
    }
)

PHOTO_RENAME = {
    "photo_thumbnail_url": "photo_thumbnail_path",
    "photo_high_resolution_url": "photo_high_resolution_path",
}


def split_core_extra(
    row: dict[str, Any],
    *,
    core_keys: frozenset[str],
    rename: dict[str, str] | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """安定キーを core、それ以外を extra。rename は source→core 名。"""
    rename = rename or {}
    core: dict[str, Any] = {}
    extra: dict[str, Any] = {}
    consumed_sources: set[str] = set()

    for src, dest in rename.items():
        if src in row:
            if dest in core_keys:
                core[dest] = row[src]
            consumed_sources.add(src)

    for key, value in row.items():
        if key in consumed_sources:
            continue
        if key in core_keys:
            core[key] = value
        else:
            # URL っぽい期限付き署名はバックアップに残さない
            if isinstance(value, str) and _looks_like_signed_url(value):
                continue
            extra[key] = value
    return core, extra


def _looks_like_signed_url(value: str) -> bool:
    lower = value.lower()
    if not lower.startswith("http://") and not lower.startswith("https://"):
        return False
    return (
        "token=" in lower
        or "x-amz-" in lower
        or "signature=" in lower
        or "/storage/v1/object/sign/" in lower
    )


def _wrap_rows(
    rows: list[dict[str, Any]],
    *,
    core_keys: frozenset[str],
    rename: dict[str, str] | None = None,
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for row in rows:
        core, extra = split_core_extra(row, core_keys=core_keys, rename=rename)
        out.append({"core": core, "extra": extra})
    return out


def build_manifest(
    *,
    kind: str,
    products: list[dict[str, Any]],
    category_tags: list[dict[str, Any]],
    storage_locations: list[dict[str, Any]],
    color_tags: list[dict[str, Any]],
    product_color_tags: list[dict[str, Any]],
    photos: list[dict[str, Any]],
    include_media_paths: bool,
) -> dict[str, Any]:
    photo_rows: list[dict[str, Any]] = []
    for photo in photos:
        row = dict(photo)
        if include_media_paths:
            photo_id = row.get("photo_id")
            path = (
                row.get("photo_high_resolution_url")
                or row.get("photo_thumbnail_url")
                or ""
            )
            ext = "jpg"
            if isinstance(path, str) and "." in path.rsplit("/", 1)[-1]:
                ext = path.rsplit(".", 1)[-1].lower()[:8] or "jpg"
            row["media_path"] = f"media/{photo_id}.{ext}" if photo_id is not None else None
        else:
            row.pop("media_path", None)
        photo_rows.append(row)

    return {
        "format": FORMAT_NAME,
        "format_version": FORMAT_VERSION,
        "kind": kind,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "app": "oshi_app",
        "entities": {
            "category_tags": _wrap_rows(category_tags, core_keys=CATEGORY_CORE_KEYS),
            "storage_locations": _wrap_rows(
                storage_locations, core_keys=STORAGE_CORE_KEYS
            ),
            "color_tags": _wrap_rows(color_tags, core_keys=COLOR_CORE_KEYS),
            "products": _wrap_rows(products, core_keys=PRODUCT_CORE_KEYS),
            "product_color_tags": _wrap_rows(
                product_color_tags, core_keys=PRODUCT_COLOR_CORE_KEYS
            ),
            "photos": _wrap_rows(
                photo_rows, core_keys=PHOTO_CORE_KEYS, rename=PHOTO_RENAME
            ),
        },
    }


def _csv_bytes(headers: list[str], rows: list[list[Any]]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return buf.getvalue().encode("utf-8-sig")


def _entity_cores(manifest: dict[str, Any], name: str) -> list[dict[str, Any]]:
    items = manifest.get("entities", {}).get(name) or []
    return [item.get("core") or {} for item in items if isinstance(item, dict)]


def build_csv_files(manifest: dict[str, Any]) -> dict[str, bytes]:
    """人間向け CSV（再取り込み用ではない）。"""
    products = _entity_cores(manifest, "products")
    product_rows = [
        [
            p.get("registered_product_id"),
            p.get("product_name"),
            p.get("barcode_number"),
            p.get("character_name"),
            p.get("works_series_name"),
            p.get("title"),
            p.get("purchase_price"),
            p.get("currency_code"),
            p.get("purchase_location"),
            p.get("category_tag_name"),
            p.get("storage_location_name"),
            ",".join(str(s) for s in (p.get("color_tag_slots") or [])),
            p.get("memo"),
            p.get("creation_date"),
            p.get("photo_id"),
        ]
        for p in products
    ]
    files: dict[str, bytes] = {
        "csv/products.csv": _csv_bytes(
            [
                "registered_product_id",
                "product_name",
                "barcode_number",
                "character_name",
                "works_series_name",
                "title",
                "purchase_price",
                "currency_code",
                "purchase_location",
                "category_tag_name",
                "storage_location_name",
                "color_tag_slots",
                "memo",
                "creation_date",
                "photo_id",
            ],
            product_rows,
        )
    }

    cats = _entity_cores(manifest, "category_tags")
    files["csv/category_tags.csv"] = _csv_bytes(
        ["category_tag_id", "category_tag_name", "slot", "display_order"],
        [
            [c.get("category_tag_id"), c.get("category_tag_name"), c.get("slot"), c.get("display_order")]
            for c in cats
        ],
    )
    storages = _entity_cores(manifest, "storage_locations")
    files["csv/storage_locations.csv"] = _csv_bytes(
        ["storage_location_id", "storage_location_name", "slot", "display_order"],
        [
            [
                s.get("storage_location_id"),
                s.get("storage_location_name"),
                s.get("slot"),
                s.get("display_order"),
            ]
            for s in storages
        ],
    )
    colors = _entity_cores(manifest, "color_tags")
    files["csv/color_tags.csv"] = _csv_bytes(
        ["color_tag_id", "color_tag_name", "slot", "color"],
        [
            [c.get("color_tag_id"), c.get("color_tag_name"), c.get("slot"), c.get("color")]
            for c in colors
        ],
    )
    return files


def build_export_zip_bytes(
    *,
    manifest: dict[str, Any],
    media_files: dict[str, bytes],
) -> bytes:
    """manifest.json + CSV + 任意の media/* を ZIP 化。"""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(
            "manifest.json",
            json.dumps(manifest, ensure_ascii=False, indent=2),
        )
        for name, content in build_csv_files(manifest).items():
            zf.writestr(name, content)
        for path, content in media_files.items():
            zf.writestr(path, content)
    return buf.getvalue()
