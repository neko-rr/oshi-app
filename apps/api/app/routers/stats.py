from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.deps.auth import AuthenticatedUser, get_access_token, require_permanent_user
from app.services import oshi_day_service, spending_budget_service
from app.services.dashboard_service import fetch_dashboard_charts
from app.services.stats_service import get_product_stats

router = APIRouter(tags=["stats"])


class SpendingBudgetBody(BaseModel):
    currency_code: str = Field(min_length=3, max_length=8)
    monthly_amount: int


class OshiDayBody(BaseModel):
    character_name: str = Field(min_length=1, max_length=80)
    start_date: str = Field(min_length=8, max_length=32)


def _validation(exc: Exception) -> HTTPException:
    if isinstance(exc, ValueError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        )
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={"code": "INTERNAL_ERROR", "message": "保存に失敗しました"},
    )


@router.get("/stats/products")
def product_stats(
    user: AuthenticatedUser = Depends(require_permanent_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return get_product_stats(
            members_id=user.members_id, access_token=access_token
        )
    except RuntimeError as exc:
        if str(exc) == "supabase_not_configured":
            return {"total": 0, "total_photos": 0, "unique_barcodes": 0}
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "統計の取得に失敗しました"},
        ) from exc


@router.get("/dashboard/charts")
def dashboard_charts(
    user: AuthenticatedUser = Depends(require_permanent_user),
    access_token: str = Depends(get_access_token),
    granularity: str = Query(default="month"),
    daily_limit: int = Query(default=90, ge=1, le=366),
) -> dict:
    try:
        return fetch_dashboard_charts(
            access_token=access_token,
            members_id=user.members_id,
            granularity=granularity,
            daily_limit=daily_limit,
        )
    except RuntimeError as exc:
        if str(exc) == "supabase_not_configured":
            from app.services.dashboard_service import empty_dashboard

            return empty_dashboard()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "ダッシュボード取得に失敗"},
        ) from exc


@router.put("/spending-budgets")
def put_spending_budget(
    body: SpendingBudgetBody,
    user: AuthenticatedUser = Depends(require_permanent_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return spending_budget_service.upsert_spending_budget(
            members_id=user.members_id,
            access_token=access_token,
            currency_code=body.currency_code,
            monthly_amount=body.monthly_amount,
        )
    except Exception as exc:
        raise _validation(exc) from exc


@router.delete("/spending-budgets/{currency_code}")
def remove_spending_budget(
    currency_code: str,
    user: AuthenticatedUser = Depends(require_permanent_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        spending_budget_service.delete_spending_budget(
            members_id=user.members_id,
            access_token=access_token,
            currency_code=currency_code,
        )
    except Exception as exc:
        raise _validation(exc) from exc
    return {"ok": True}


@router.put("/oshi-days")
def put_oshi_day(
    body: OshiDayBody,
    user: AuthenticatedUser = Depends(require_permanent_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return oshi_day_service.upsert_oshi_day(
            members_id=user.members_id,
            access_token=access_token,
            character_name=body.character_name,
            start_date=body.start_date,
        )
    except Exception as exc:
        raise _validation(exc) from exc


@router.delete("/oshi-days")
def remove_oshi_day(
    character_name: str = Query(min_length=1, max_length=80),
    user: AuthenticatedUser = Depends(require_permanent_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        oshi_day_service.delete_oshi_day(
            members_id=user.members_id,
            access_token=access_token,
            character_name=character_name,
        )
    except Exception as exc:
        raise _validation(exc) from exc
    return {"ok": True}
