# TDD: 通貨ごとの毎月予算。今月の支出と比べ、超過は残額を負にする。
from __future__ import annotations

from app.services.spending_budget_service import build_budget_status


def test_build_budget_status_remaining_and_unset() -> None:
    rows = build_budget_status(
        spent_rows=[
            {"currency_code": "JPY", "total": 12000},
            {"currency_code": "USD", "total": 10},
        ],
        budgets=[{"currency_code": "JPY", "monthly_amount": 10000}],
    )
    by_code = {row["currency_code"]: row for row in rows}
    assert by_code["JPY"]["spent"] == 12000
    assert by_code["JPY"]["monthly_amount"] == 10000
    assert by_code["JPY"]["remaining"] == -2000
    assert by_code["USD"]["monthly_amount"] is None
    assert by_code["USD"]["remaining"] is None
