# TDD: 正規化にタグ系フィールドを含む。一覧フィルタは fetch 側（DB）へ委譲。
from __future__ import annotations

from app.services.product_service import (
    filter_products_by_query,
    list_products_for_member,
    normalize_product_row,
)


def test_filter_products_by_query_matches_name_and_tags() -> None:
    """ユーティリティの契約（テスト・移行用）。一覧本線は fetch に q を渡す。"""
    items = [
        {
            "product_name": "缶バッジ",
            "category_tag": {"name": "ガチャ"},
            "storage_location": {"name": "棚A"},
        },
        {
            "product_name": "アクスタ",
            "category_tag": {"name": "アクリル"},
            "storage_location": {"name": "箱"},
        },
    ]
    assert [i["product_name"] for i in filter_products_by_query(items, "缶")] == [
        "缶バッジ"
    ]
    assert [i["product_name"] for i in filter_products_by_query(items, "棚")] == [
        "缶バッジ"
    ]
    assert len(filter_products_by_query(items, "  ")) == 2


def test_list_products_passes_q_to_fetch_not_post_filter() -> None:
    """q はページ取得後の絞り込みではなく fetch に渡す（DB 側想定）。"""
    captured: dict = {}

    def fake_fetch(
        *,
        members_id: str,
        access_token: str,
        limit: int,
        offset: int,
        barcode_number: str | None = None,
        q: str | None = None,
        category_tag_ids: list[int] | None = None,
        storage_location_ids: list[int] | None = None,
        color_tag_slots: list[int] | None = None,
        sort: str | None = None,
    ):
        captured["q"] = q
        captured["category_tag_ids"] = category_tag_ids
        captured["storage_location_ids"] = storage_location_ids
        # DB が既に絞った結果だけ返す
        return [
            {
                "registered_product_id": 2,
                "product_name": "アクスタ",
                "photo_id": None,
                "creation_date": None,
                "photo": None,
            },
        ]

    mid = "33333333-3333-3333-3333-333333333333"
    items = list_products_for_member(
        mid,
        access_token="user-jwt",
        q="アク",
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert captured["q"] == "アク"
    assert len(items) == 1
    assert items[0]["product_name"] == "アクスタ"


def test_list_products_passes_tag_ids_to_fetch() -> None:
    captured: dict = {}

    def fake_fetch(
        *,
        members_id: str,
        access_token: str,
        limit: int,
        offset: int,
        barcode_number: str | None = None,
        q: str | None = None,
        category_tag_ids: list[int] | None = None,
        storage_location_ids: list[int] | None = None,
        color_tag_slots: list[int] | None = None,
        sort: str | None = None,
    ):
        captured["category_tag_ids"] = category_tag_ids
        captured["storage_location_ids"] = storage_location_ids
        captured["color_tag_slots"] = color_tag_slots
        return []

    mid = "33333333-3333-3333-3333-333333333333"
    list_products_for_member(
        mid,
        access_token="user-jwt",
        category_tag_ids=[11, 12],
        storage_location_ids=[22],
        color_tag_slots=[3],
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert captured["category_tag_ids"] == [11, 12]
    assert captured["storage_location_ids"] == [22]
    assert captured["color_tag_slots"] == [3]


def test_list_products_passes_product_color_codes_when_set() -> None:
    """グッズの色があるときだけ fetch に渡す。空なら古い差し替えを壊さない。"""
    captured: dict = {}

    def fake_fetch(
        *,
        members_id: str,
        access_token: str,
        limit: int,
        offset: int,
        barcode_number: str | None = None,
        q: str | None = None,
        category_tag_ids: list[int] | None = None,
        storage_location_ids: list[int] | None = None,
        color_tag_slots: list[int] | None = None,
        product_color_codes: list[str] | None = None,
        sort: str | None = None,
    ):
        captured["product_color_codes"] = product_color_codes
        return []

    mid = "33333333-3333-3333-3333-333333333333"
    list_products_for_member(
        mid,
        access_token="user-jwt",
        product_color_codes=["pink", "black"],
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert captured["product_color_codes"] == ["pink", "black"]

def test_list_products_filters_by_barcode_exact() -> None:
    def fake_fetch(
        *,
        members_id: str,
        access_token: str,
        limit: int,
        offset: int,
        barcode_number: str | None = None,
        q: str | None = None,
        category_tag_id: int | None = None,
        storage_location_id: int | None = None,
        sort: str | None = None,
    ):
        rows = [
            {
                "registered_product_id": 1,
                "product_name": "缶バッジ",
                "barcode_number": "490111",
                "photo_id": None,
                "creation_date": None,
                "photo": None,
            },
            {
                "registered_product_id": 2,
                "product_name": "アクスタ",
                "barcode_number": "490222",
                "photo_id": None,
                "creation_date": None,
                "photo": None,
            },
        ]
        if barcode_number:
            return [r for r in rows if r.get("barcode_number") == barcode_number]
        return rows

    mid = "33333333-3333-3333-3333-333333333333"
    items = list_products_for_member(
        mid,
        access_token="user-jwt",
        barcode="490222",
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert len(items) == 1
    assert items[0]["product_name"] == "アクスタ"
    assert items[0]["barcode_number"] == "490222"


def test_normalize_product_row_includes_barcode() -> None:
    out = normalize_product_row(
        {
            "registered_product_id": 1,
            "product_name": "X",
            "barcode_number": "123",
            "photo": None,
        }
    )
    assert out["barcode_number"] == "123"


def test_normalize_product_row_maps_gallery_fields() -> None:
    row = {
        "registered_product_id": 42,
        "product_name": "アクスタ",
        "photo_id": 7,
        "creation_date": "2026-01-02",
        "photo": {"photo_thumbnail_url": "uid/thumb.jpg"},
        "category_tag_id": 1,
        "storage_location_id": 2,
        "category_tag": {"category_tag_name": "缶", "category_tag_color": "#f00", "category_tag_icon": "circle"},
        "storage_location": {
            "storage_location_name": "棚",
            "storage_location_icon": "box",
        },
    }
    out = normalize_product_row(row)
    assert out["photo_thumbnail_path"] == "uid/thumb.jpg"
    assert out["photo_thumbnail_url"] is None
    assert out["category_tag"] == {
        "name": "缶",
        "color": "#f00",
        "icon": "circle",
    }
    assert out["storage_location"] == {
        "name": "棚",
        "icon": "box",
    }
    assert out["color_tag_slots"] == []


def test_list_products_uses_fetch_and_filters_by_member_context() -> None:
    def fake_fetch(*, members_id: str, access_token: str, limit: int, offset: int, **_kw):
        return [
            {
                "registered_product_id": 1,
                "product_name": "A",
                "photo_id": None,
                "creation_date": None,
                "photo": None,
            }
        ]

    mid = "33333333-3333-3333-3333-333333333333"
    items = list_products_for_member(
        mid,
        access_token="user-jwt",
        limit=24,
        offset=0,
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert items[0]["product_name"] == "A"
    assert items[0]["photo_thumbnail_url"] is None


def test_list_products_edit_view_keeps_registration_fields() -> None:
    """view=edit は登録項目と外部参照を返し、fetch に view を渡す。"""
    captured: dict = {}

    def fake_fetch(**kwargs):
        captured["view"] = kwargs.get("view")
        return [
            {
                "registered_product_id": 4,
                "product_name": "缶バッジ",
                "photo_id": 8,
                "memo": "見た目メモ",
                "character_name": "風ねこ",
                "works_series_name": "作品",
                "title": "タイトル",
                "product_group_name": "グループ",
                "purchase_location": "会場",
                "purchase_date": "2026-10-01",
                "registration_quantity": 2,
                "sales_desired_flag": 0,
                "sales_desired_quantity": 0,
                "want_object_flag": 1,
                "barcode_number": "4901",
                "creation_date": None,
                "photo": None,
                "product_external_ref": [
                    {
                        "source": "manual",
                        "product_url": "https://example.com/item",
                        "label": "通販",
                        "is_primary": True,
                    }
                ],
            }
        ]

    items = list_products_for_member(
        "33333333-3333-3333-3333-333333333333",
        access_token="user-jwt",
        view="edit",
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert captured["view"] == "edit"
    assert items[0]["memo"] == "見た目メモ"
    assert items[0]["character_name"] == "風ねこ"
    assert items[0]["works_series_name"] == "作品"
    assert items[0]["purchase_date"] == "2026-10-01"
    assert items[0]["want_object_flag"] == 1
    assert items[0]["external_refs"][0]["source"] == "manual"
    assert items[0]["external_refs"][0]["product_url"] == "https://example.com/item"


def test_list_products_passes_status_flags_to_fetch() -> None:
    captured: dict = {}

    def fake_fetch(**kwargs):
        captured["sales_desired"] = kwargs.get("sales_desired")
        captured["want_object"] = kwargs.get("want_object")
        return []

    list_products_for_member(
        "33333333-3333-3333-3333-333333333333",
        access_token="user-jwt",
        sales_desired=True,
        want_object=True,
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert captured["sales_desired"] is True
    assert captured["want_object"] is True


def test_list_products_browse_omits_edit_fields() -> None:
    def fake_fetch(**kwargs):
        return [
            {
                "registered_product_id": 4,
                "product_name": "缶バッジ",
                "photo_id": None,
                "memo": "秘匿にしないが閲覧一覧には出さない",
                "character_name": "風ねこ",
                "creation_date": None,
                "photo": None,
            }
        ]

    items = list_products_for_member(
        "33333333-3333-3333-3333-333333333333",
        access_token="user-jwt",
        fetch_page=fake_fetch,
        sign_object=lambda **_: None,
    )
    assert "memo" not in items[0]
    assert "character_name" not in items[0]
    assert "external_refs" not in items[0]


def test_list_products_returns_empty_when_supabase_unconfigured() -> None:
    def boom(**_kwargs):
        raise RuntimeError("supabase_not_configured")

    assert (
        list_products_for_member(
            "33333333-3333-3333-3333-333333333333",
            access_token="tok",
            fetch_page=boom,
        )
        == []
    )
