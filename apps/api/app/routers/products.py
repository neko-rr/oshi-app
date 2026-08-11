from fastapi import APIRouter, Depends

from app.deps.auth import AuthenticatedUser, get_current_user
from app.services.product_service import list_products_for_member


@router.get("")
def list_products(
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """製品一覧（サービス層経由）。"""
    items = list_products_for_member(user.members_id)
    return {
        "items": items,
        "members_id": user.members_id,
        "message": "not_implemented_yet" if not items else "ok",
    }
