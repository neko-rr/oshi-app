from app.services.product_service import list_products_for_member
import pytest


def test_list_products_requires_members_id() -> None:
    with pytest.raises(ValueError):
        list_products_for_member("")


def test_list_products_empty_placeholder() -> None:
    assert list_products_for_member("33333333-3333-3333-3333-333333333333") == []
