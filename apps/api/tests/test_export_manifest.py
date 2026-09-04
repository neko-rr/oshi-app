# TDD: 書き出し manifest の core/extra 分割と署名 URL 非含有。
from __future__ import annotations

import json
import zipfile
from io import BytesIO

from app.services.export_manifest import (
    FORMAT_NAME,
    FORMAT_VERSION,
    build_export_zip_bytes,
    build_manifest,
    split_core_extra,
)


def test_split_core_extra_puts_unknown_in_extra() -> None:
    row = {
        "registered_product_id": 1,
        "product_name": "badge",
        "memo": "memo",
        "future_column": "new",
        "photo_thumbnail_url": "uid/a.jpg",
    }
    core_keys = frozenset(
        [
            "registered_product_id",
            "product_name",
            "memo",
            "photo_thumbnail_path",
        ]
    )
    rename = {"photo_thumbnail_url": "photo_thumbnail_path"}
    core, extra = split_core_extra(row, core_keys=core_keys, rename=rename)
    assert core["product_name"] == "badge"
    assert core["photo_thumbnail_path"] == "uid/a.jpg"
    assert "photo_thumbnail_url" not in core
    assert extra["future_column"] == "new"
    assert "product_name" not in extra


def test_manifest_has_version_and_no_signed_urls() -> None:
    manifest = build_manifest(
        kind="text",
        products=[
            {
                "registered_product_id": 9,
                "product_name": "acrylic",
                "barcode_number": "490",
                "memo": None,
                "purchase_price": 1000,
                "currency_code": "JPY",
                "photo_id": 3,
                "category_tag_id": 1,
                "storage_location_id": 2,
                "creation_date": "2026-01-01T00:00:00+00:00",
                "weird_new_col": 1,
            }
        ],
        category_tags=[
            {"category_tag_id": 1, "category_tag_name": "can", "slot": 1}
        ],
        storage_locations=[
            {"storage_location_id": 2, "storage_location_name": "shelf", "slot": 1}
        ],
        color_tags=[
            {
                "color_tag_id": 7,
                "color_tag_name": "red",
                "slot": 1,
                "color": "#f00",
            }
        ],
        product_color_tags=[
            {"registered_product_id": 9, "slot": 1, "color_tag_id": 7}
        ],
        photos=[
            {
                "photo_id": 3,
                "photo_thumbnail_url": "m/p.jpg",
                "photo_high_resolution_url": "m/p.jpg",
            }
        ],
        include_media_paths=False,
    )
    assert manifest["format"] == FORMAT_NAME
    assert manifest["format_version"] == FORMAT_VERSION
    assert manifest["kind"] == "text"
    dumped = json.dumps(manifest)
    assert "token=" not in dumped
    assert "X-Amz-" not in dumped
    assert "https://" not in dumped
    product = manifest["entities"]["products"][0]
    assert product["core"]["product_name"] == "acrylic"
    assert product["extra"]["weird_new_col"] == 1
    photo = manifest["entities"]["photos"][0]
    assert photo["core"]["photo_thumbnail_path"] == "m/p.jpg"
    assert "media_path" not in photo["core"]


def test_text_zip_contains_manifest_and_csv() -> None:
    manifest = build_manifest(
        kind="text",
        products=[
            {
                "registered_product_id": 1,
                "product_name": "A",
                "barcode_number": None,
                "memo": "x",
                "purchase_price": None,
                "currency_code": None,
                "photo_id": None,
                "category_tag_id": None,
                "storage_location_id": None,
                "creation_date": None,
            }
        ],
        category_tags=[],
        storage_locations=[],
        color_tags=[],
        product_color_tags=[],
        photos=[],
        include_media_paths=False,
    )
    blob = build_export_zip_bytes(manifest=manifest, media_files={})
    with zipfile.ZipFile(BytesIO(blob)) as zf:
        names = set(zf.namelist())
        assert "manifest.json" in names
        assert "csv/products.csv" in names
        body = json.loads(zf.read("manifest.json").decode("utf-8"))
        assert body["format"] == FORMAT_NAME
