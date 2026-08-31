from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps.auth import AuthenticatedUser, get_access_token, get_current_user
from app.services.dashboard_service import fetch_dashboard_charts
from app.services.stats_service import get_product_stats

router = APIRouter(tags=["stats"])


@router.get("/stats/products")
def product_stats(
    user: AuthenticatedUser = Depends(get_current_user),
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
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
    granularity: str = Query(default="month"),
    daily_limit: int = Query(default=90, ge=1, le=366),
) -> dict:
    _ = user
    try:
        return fetch_dashboard_charts(
            access_token=access_token,
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
