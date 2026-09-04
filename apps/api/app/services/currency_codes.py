"""ISO 4217 通貨コード（製品記録・表示設定で共有）。"""

from __future__ import annotations

from typing import Any

# Web CURRENCY_OPTIONS / display_settings と揃える
ALLOWED_CURRENCY_CODE = frozenset(
    {
        "JPY",
        "KRW",
        "TWD",
        "CNY",
        "HKD",
        "SGD",
        "THB",
        "VND",
        "IDR",
        "MYR",
        "PHP",
        "INR",
        "AUD",
        "NZD",
        "USD",
        "CAD",
        "MXN",
        "BRL",
        "ARS",
        "GBP",
        "EUR",
        "CHF",
        "SEK",
        "PLN",
        "RUB",
        "TRY",
        "AED",
        "SAR",
        "EGP",
        "ILS",
        "ZAR",
    }
)


def normalize_currency_code(value: Any, *, field: str = "currency_code") -> str | None:
    """空は None。未対応コードは ValueError。"""
    if value is None:
        return None
    raw = str(value).strip().upper()
    if not raw:
        return None
    if raw not in ALLOWED_CURRENCY_CODE:
        raise ValueError(f"未対応の通貨コードです（{field}）")
    return raw
