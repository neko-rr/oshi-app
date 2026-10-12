# TDD: 統計タブの所持数・内訳・通貨別支出（換算なし）。
from __future__ import annotations

from app.services.dashboard_service import build_collection_summary


def test_build_collection_summary_counts_breakdown_and_spend() -> None:
    out = build_collection_summary(
        products=[
            {
                "purchase_price": 1200,
                "currency_code": "jpy",
                "category_tag_id": 1,
                "storage_location_id": 9,
                "sales_desired_flag": 1,
                "want_object_flag": 0,
            },
            {
                "purchase_price": 800,
                "currency_code": "JPY",
                "category_tag_id": 1,
                "storage_location_id": None,
                "sales_desired_flag": 0,
                "want_object_flag": 1,
            },
            {
                "purchase_price": 10,
                "currency_code": "USD",
                "category_tag_id": None,
                "storage_location_id": 9,
                "sales_desired_flag": "1",
                "want_object_flag": "1",
            },
            {
                "purchase_price": None,
                "currency_code": None,
                "category_tag_id": 2,
                "storage_location_id": 9,
                "sales_desired_flag": 0,
                "want_object_flag": 0,
            },
        ],
        categories=[
            {"category_tag_id": 1, "category_tag_name": "缶"},
            {"category_tag_id": 2, "category_tag_name": "本"},
        ],
        storage_locations=[
            {"storage_location_id": 9, "storage_location_name": "棚"},
        ],
    )
    assert out["product_count"] == 4
    assert out["want_object_count"] == 2
    assert out["sales_desired_count"] == 2
    assert out["uncategorized_count"] == 1
    assert out["unstored_count"] == 1
    assert out["unpriced_count"] == 1
    cats = {row["category_tag_id"]: row for row in out["categories"]}
    assert cats[1]["count"] == 2
    assert cats[1]["name"] == "缶"
    assert cats[1]["share"] == 0.5
    assert cats[2]["count"] == 1
    stores = {row["storage_location_id"]: row for row in out["storage_locations"]}
    assert stores[9]["count"] == 3
    assert stores[9]["name"] == "棚"
    spend = {row["currency_code"]: row for row in out["spend_by_currency"]}
    assert spend["JPY"]["total"] == 2000
    assert spend["JPY"]["priced_count"] == 2
    assert spend["USD"]["total"] == 10
    assert spend["USD"]["priced_count"] == 1


def test_build_collection_summary_storage_remaining() -> None:
    out = build_collection_summary(
        products=[
            {"storage_location_id": 9, "purchase_price": 1, "currency_code": "JPY"},
            {"storage_location_id": 9, "purchase_price": 1, "currency_code": "JPY"},
            {"storage_location_id": 9, "purchase_price": 1, "currency_code": "JPY"},
        ],
        categories=[],
        storage_locations=[
            {
                "storage_location_id": 9,
                "storage_location_name": "棚",
                "storage_count_per_1": 10,
            },
        ],
    )
    row = out["storage_locations"][0]
    assert row["count"] == 3
    assert row["capacity_count"] == 10
    assert row["remaining"] == 7


def test_build_collection_summary_photo_and_duplicate_barcode() -> None:
    """写真なしと、同じバーコードが2件以上の品を数える。空の番号は重なりにしない。"""
    out = build_collection_summary(
        products=[
            {
                "barcode_number": "111",
                "photo_id": None,
                "category_tag_id": None,
                "storage_location_id": None,
            },
            {
                "barcode_number": "111",
                "photo_id": 5,
                "category_tag_id": 1,
                "storage_location_id": 9,
            },
            {
                "barcode_number": "222",
                "photo_id": None,
                "category_tag_id": 1,
                "storage_location_id": 9,
            },
            {
                "barcode_number": "  ",
                "photo_id": 6,
                "category_tag_id": 1,
                "storage_location_id": 9,
            },
        ],
        categories=[{"category_tag_id": 1, "category_tag_name": "缶"}],
        storage_locations=[
            {
                "storage_location_id": 9,
                "storage_location_name": "棚",
                "storage_count_per_1": 10,
            },
        ],
    )
    assert out["missing_photo_count"] == 2
    assert out["duplicate_barcode_count"] == 2
    assert out["uncategorized_count"] == 1
    assert out["unstored_count"] == 1


def test_build_collection_summary_groups_months_and_undated() -> None:
    out = build_collection_summary(
        products=[
            {
                "purchase_price": 500,
                "currency_code": "JPY",
                "purchase_date": "2026-09-02",
                "character_name": " 風ねこ ",
            },
            {
                "purchase_price": 300,
                "currency_code": "JPY",
                "purchase_date": "2026-10-01",
            },
            {
                "purchase_price": 9,
                "currency_code": "USD",
                "purchase_date": None,
            },
            {"purchase_price": None, "purchase_date": "not-a-date"},
        ],
        categories=[],
        storage_locations=[],
        today="2026-10-12",
    )
    assert out["current_month"] == "2026-10"
    assert out["character_names"] == ["風ねこ"]
    assert [row["month"] for row in out["spend_months"]] == ["2026-10", "2026-09"]
    october = out["spend_months"][0]["spend_by_currency"]
    assert october[0]["currency_code"] == "JPY"
    assert october[0]["total"] == 300
    assert out["undated_item_count"] == 2
    assert out["undated_spend"][0]["currency_code"] == "USD"
    assert out["undated_spend"][0]["total"] == 9


def test_build_collection_summary_empty() -> None:
    out = build_collection_summary(
        products=[],
        categories=[],
        storage_locations=[],
    )
    assert out["product_count"] == 0
    assert out["categories"] == []
    assert out["spend_by_currency"] == []
    assert out["unpriced_count"] == 0
