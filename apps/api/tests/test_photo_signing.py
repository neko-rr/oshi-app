# TDD: サムネイル object path を signed URL に変換（実 Storage は叩かない）
from __future__ import annotations

from app.services.product_service import list_products_for_member, normalize_product_row
from app.infra.photo_signing import resolve_signed_url


def test_normalize_includes_null_signed_url_by_default() -> None:
    row = {
        "registered_product_id": 1,
        "product_name": "X",
        "photo_id": 2,
        "creation_date": None,
        "photo": {"photo_thumbnail_url": "mid/a.jpg"},
    }
    out = normalize_product_row(row)
    assert out["photo_thumbnail_path"] == "mid/a.jpg"
    assert out["photo_thumbnail_url"] is None


def test_resolve_signed_url_passes_through_https() -> None:
    assert (
        resolve_signed_url(
            "https://example.supabase.co/storage/v1/object/sign/photos/x?token=a",
            access_token="t",
            sign_http=lambda **_: None,
        )
        == "https://example.supabase.co/storage/v1/object/sign/photos/x?token=a"
    )


def test_resolve_signed_url_calls_signer_for_object_path() -> None:
    def fake_sign(*, object_path: str, access_token: str, expires_in: int):
        assert object_path == "uid/thumb.jpg"
        assert access_token == "tok"
        assert expires_in == 3600
        return "https://signed.example/thumb"

    assert (
        resolve_signed_url(
            "uid/thumb.jpg",
            access_token="tok",
            sign_http=fake_sign,
        )
        == "https://signed.example/thumb"
    )


def test_list_products_attaches_signed_thumbnail_url() -> None:
    def fake_fetch(**_kwargs):
        return [
            {
                "registered_product_id": 1,
                "product_name": "A",
                "photo_id": 9,
                "creation_date": None,
                "photo": {"photo_thumbnail_url": "m/t.jpg"},
            }
        ]

    def fake_sign_path(*, object_path: str, access_token: str, expires_in: int = 3600):
        return f"https://cdn.example/{object_path}?e={expires_in}&t={access_token[:3]}"

    items = list_products_for_member(
        "33333333-3333-3333-3333-333333333333",
        access_token="tok",
        fetch_page=fake_fetch,
        sign_object=fake_sign_path,
    )
    assert items[0]["photo_thumbnail_path"] == "m/t.jpg"
    assert items[0]["photo_thumbnail_url"] == "https://cdn.example/m/t.jpg?e=3600&t=tok"
