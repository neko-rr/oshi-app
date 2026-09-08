"""ダブり土台: 所持数・交換OKの自動付与ヘルパ。"""

from __future__ import annotations

from typing import Any


def normalize_registration_quantity(value: Any) -> int | None:
    """None / 空は未設定。1〜999。"""
    if value is None:
        return None
    if isinstance(value, str) and not value.strip():
        return None
    if isinstance(value, bool):
        raise ValueError("所持数が不正です")
    try:
        n = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("所持数が不正です") from exc
    if n < 1 or n > 999:
        raise ValueError("所持数は 1〜999 です")
    return n


def normalize_sales_desired_quantity(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, str) and not value.strip():
        return None
    if isinstance(value, bool):
        raise ValueError("交換OK数が不正です")
    try:
        n = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("交換OK数が不正です") from exc
    if n < 0 or n > 999:
        raise ValueError("交換OK数は 0〜999 です")
    return n


def normalize_flag_01(value: Any, *, field: str) -> int:
    if value is None:
        return 0
    if isinstance(value, bool):
        return 1 if value else 0
    try:
        n = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field} が不正です") from exc
    if n not in (0, 1):
        raise ValueError(f"{field} が不正です")
    return n


def effective_owned_quantity(registration_quantity: int | None) -> int:
    """UI / 自動付与用。未設定は 1 扱い。"""
    return registration_quantity if registration_quantity is not None else 1


def sales_desired_looks_untouched(
    *,
    sales_desired_flag: int | None,
    sales_desired_quantity: int | None,
) -> bool:
    flag = sales_desired_flag if sales_desired_flag is not None else 0
    qty = sales_desired_quantity if sales_desired_quantity is not None else 0
    return flag == 0 and qty == 0


def apply_auto_sales_desired(
    *,
    registration_quantity: int | None,
    sales_desired_flag: int | None,
    sales_desired_quantity: int | None,
    keep_at_hand_count: int,
    auto_sales_desired: bool,
    user_touched_sales: bool,
) -> tuple[int, int | None]:
    """自動付与の結果 (flag, quantity) を返す。

    user_touched_sales が True、または auto が OFF のときは入力値を正規化して返す。
    未設定フラグは 0、数量は None のまま（DB 既定に任せる場合は呼び出し側で処理）。
    """
    flag = normalize_flag_01(sales_desired_flag, field="sales_desired_flag")
    qty = normalize_sales_desired_quantity(sales_desired_quantity)

    if user_touched_sales or not auto_sales_desired:
        return flag, qty

    owned = effective_owned_quantity(registration_quantity)
    keep = max(1, min(99, int(keep_at_hand_count)))
    if owned > keep:
        return 1, owned - keep
    return flag, qty
