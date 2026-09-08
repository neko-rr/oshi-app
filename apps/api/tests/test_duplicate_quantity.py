"""TDD: ダブり土台の所持数・交換OK自動付与。"""

from __future__ import annotations

import pytest

from app.services.duplicate_quantity import (
    apply_auto_sales_desired,
    effective_owned_quantity,
    normalize_registration_quantity,
    sales_desired_looks_untouched,
)


def test_normalize_registration_quantity() -> None:
    assert normalize_registration_quantity(None) is None
    assert normalize_registration_quantity(3) == 3
    with pytest.raises(ValueError):
        normalize_registration_quantity(0)
    with pytest.raises(ValueError):
        normalize_registration_quantity(True)


def test_effective_owned_quantity_defaults_to_one() -> None:
    assert effective_owned_quantity(None) == 1
    assert effective_owned_quantity(5) == 5


def test_apply_auto_when_surplus() -> None:
    flag, qty = apply_auto_sales_desired(
        registration_quantity=3,
        sales_desired_flag=None,
        sales_desired_quantity=None,
        keep_at_hand_count=1,
        auto_sales_desired=True,
        user_touched_sales=False,
    )
    assert flag == 1
    assert qty == 2


def test_apply_auto_skips_when_user_touched() -> None:
    flag, qty = apply_auto_sales_desired(
        registration_quantity=5,
        sales_desired_flag=0,
        sales_desired_quantity=0,
        keep_at_hand_count=1,
        auto_sales_desired=True,
        user_touched_sales=True,
    )
    assert flag == 0
    assert qty == 0


def test_apply_auto_off_leaves_values() -> None:
    flag, qty = apply_auto_sales_desired(
        registration_quantity=4,
        sales_desired_flag=None,
        sales_desired_quantity=None,
        keep_at_hand_count=1,
        auto_sales_desired=False,
        user_touched_sales=False,
    )
    assert flag == 0
    assert qty is None


def test_sales_desired_looks_untouched() -> None:
    assert sales_desired_looks_untouched(
        sales_desired_flag=0, sales_desired_quantity=None
    )
    assert not sales_desired_looks_untouched(
        sales_desired_flag=1, sales_desired_quantity=1
    )
