"""通貨ごとの毎月の支出上限。月ごとに金額を変えない。換算しない。"""

from __future__ import annotations

import logging
from typing import Any

from app.infra.supabase_user import create_user_client
from app.services.currency_codes import normalize_currency_code

logger = logging.getLogger(__name__)

MAX_AMOUNT = 999_999_999


def normalize_monthly_amount(raw: Any) -> int:
    if isinstance(raw, bool) or raw is None:
        raise ValueError("予算の金額を入力してください")
    try:
        amount = int(raw)
    except (TypeError, ValueError) as exc:
        raise ValueError("予算の金額を入力してください") from exc
    if amount < 0 or amount > MAX_AMOUNT:
        raise ValueError("予算の金額が範囲外です")
    return amount


def build_budget_status(
    *,
    spent_rows: list[dict[str, Any]],
    budgets: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    spent: dict[str, int] = {}
    for row in spent_rows:
        if not isinstance(row, dict):
            continue
        code = row.get("currency_code")
        if not isinstance(code, str) or not code.strip():
            continue
        try:
            spent[code] = int(row.get("total") or 0)
        except (TypeError, ValueError):
            continue
    amounts: dict[str, int] = {}
    for row in budgets:
        if not isinstance(row, dict):
            continue
        code = row.get("currency_code")
        if not isinstance(code, str) or not code.strip():
            continue
        try:
            amounts[code] = int(row.get("monthly_amount"))
        except (TypeError, ValueError):
            continue
    out: list[dict[str, Any]] = []
    for code in sorted(set(spent) | set(amounts)):
        amount = amounts.get(code)
        used = spent.get(code, 0)
        out.append(
            {
                "currency_code": code,
                "monthly_amount": amount,
                "spent": used,
                "remaining": None if amount is None else amount - used,
            }
        )
    return out


def list_spending_budget_rows(
    *, members_id: str, access_token: str
) -> list[dict[str, Any]]:
    if not str(members_id or "").strip() or not str(access_token or "").strip():
        return []
    client = create_user_client(str(access_token).strip())
    resp = (
        client.table("spending_budget")
        .select("currency_code,monthly_amount")
        .eq("members_id", str(members_id).strip())
        .execute()
    )
    return [row for row in (resp.data or []) if isinstance(row, dict)]


def upsert_spending_budget(
    *,
    members_id: str,
    access_token: str,
    currency_code: str,
    monthly_amount: int,
) -> dict[str, Any]:
    if not str(members_id or "").strip() or not str(access_token or "").strip():
        raise ValueError("members_id が空です")
    code = normalize_currency_code(currency_code, field="currency_code")
    if code is None:
        raise ValueError("通貨を選んでください")
    amount = normalize_monthly_amount(monthly_amount)
    client = create_user_client(str(access_token).strip())
    payload = {
        "members_id": str(members_id).strip(),
        "currency_code": code,
        "monthly_amount": amount,
    }
    resp = (
        client.table("spending_budget")
        .upsert(payload, on_conflict="members_id,currency_code")
        .execute()
    )
    if getattr(resp, "error", None):
        logger.exception("支出予算の保存に失敗: %s", resp.error)
        raise RuntimeError("支出予算の保存に失敗しました")
    return {"currency_code": code, "monthly_amount": amount}


def delete_spending_budget(
    *,
    members_id: str,
    access_token: str,
    currency_code: str,
) -> bool:
    if not str(members_id or "").strip() or not str(access_token or "").strip():
        raise ValueError("members_id が空です")
    code = normalize_currency_code(currency_code, field="currency_code")
    if code is None:
        raise ValueError("通貨を選んでください")
    client = create_user_client(str(access_token).strip())
    (
        client.table("spending_budget")
        .delete()
        .eq("members_id", str(members_id).strip())
        .eq("currency_code", code)
        .execute()
    )
    return True
