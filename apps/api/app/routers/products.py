from fastapi import APIRouter, Depends

from app.deps.auth import AuthenticatedUser, get_current_user

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
def list_products(
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """製品一覧プレースホルダ（DB 接続は後続）。"""
    return {
        "items": [],
        "members_id": user.members_id,
        "message": "not_implemented_yet",
    }
