"""退会・アカウント削除 HTTP（業務は account_delete_service）。"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.deps.auth import AuthenticatedUser, get_current_user
from app.services import account_delete_service

router = APIRouter(tags=["account"])

_CONFIRMATION = "DELETE"


class AccountDeleteBody(BaseModel):
    confirmation: str = Field(min_length=1, max_length=32)


def _err(exc: Exception) -> HTTPException:
    if isinstance(exc, account_delete_service.AccountDeleteUnavailableError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "ACCOUNT_DELETE_UNAVAILABLE",
                "message": str(exc),
            },
        )
    if isinstance(exc, account_delete_service.AccountDeleteFailedError):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "ACCOUNT_DELETE_FAILED", "message": "退会処理に失敗しました"},
        )
    if isinstance(exc, ValueError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        )
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={"code": "INTERNAL_ERROR", "message": "退会処理に失敗しました"},
    )


@router.delete("/account")
def delete_account(
    body: AccountDeleteBody,
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    if body.confirmation != _CONFIRMATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_CONFIRMATION",
                "message": "確認語が一致しません",
            },
        )
    try:
        account_delete_service.delete_account_for_member(members_id=user.members_id)
    except Exception as exc:
        raise _err(exc) from exc
    return {"deleted": True}
