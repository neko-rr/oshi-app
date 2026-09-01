"""テーマ設定 HTTP（業務は theme_service）。"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.deps.auth import AuthenticatedUser, get_access_token, get_current_user
from app.services import theme_service

router = APIRouter(tags=["theme-settings"])


class ThemeSettingsBody(BaseModel):
    theme: str = Field(min_length=1, max_length=64)


def _err(exc: Exception) -> HTTPException:
    if isinstance(exc, ValueError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        )
    if isinstance(exc, RuntimeError) and str(exc) == "supabase_not_configured":
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Supabase 未設定"},
        )
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={"code": "INTERNAL_ERROR", "message": "テーマ操作に失敗しました"},
    )


@router.get("/theme-settings")
def get_theme_settings(
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        theme = theme_service.get_theme(
            members_id=user.members_id, access_token=access_token
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"theme": theme}


@router.put("/theme-settings")
def put_theme_settings(
    body: ThemeSettingsBody,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        theme = theme_service.save_theme(
            members_id=user.members_id,
            access_token=access_token,
            theme=body.theme,
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"theme": theme}
