"""推し色設定 HTTP（業務は oshi_accent_service）。"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.deps.auth import AuthenticatedUser, get_access_token, get_current_user
from app.services import oshi_accent_service
from app.services.oshi_accent_service import PremiumRequiredError

router = APIRouter(tags=["oshi-accent-settings"])


class OshiAccentPresetBody(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    main_hex: str = Field(min_length=4, max_length=7)
    sub_hex: str = Field(min_length=4, max_length=7)


class OshiAccentSettingsBody(BaseModel):
    main_hex: str = Field(min_length=4, max_length=7)
    sub_hex: str = Field(min_length=4, max_length=7)
    active: bool = False
    presets: list[OshiAccentPresetBody] = Field(default_factory=list)


def _err(exc: Exception) -> HTTPException:
    if isinstance(exc, PremiumRequiredError):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "PREMIUM_REQUIRED",
                "message": str(exc) or "推し色の保存・適用にはプレミアムが必要です",
            },
        )
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
        detail={"code": "INTERNAL_ERROR", "message": "推し色の操作に失敗しました"},
    )


@router.get("/oshi-accent-settings")
def get_oshi_accent_settings(
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return oshi_accent_service.get_oshi_accent(
            members_id=user.members_id, access_token=access_token
        )
    except Exception as exc:
        raise _err(exc) from exc


@router.put("/oshi-accent-settings")
def put_oshi_accent_settings(
    body: OshiAccentSettingsBody,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return oshi_accent_service.save_oshi_accent(
            members_id=user.members_id,
            access_token=access_token,
            main_hex=body.main_hex,
            sub_hex=body.sub_hex,
            active=body.active,
            presets=[p.model_dump() for p in body.presets],
        )
    except Exception as exc:
        raise _err(exc) from exc
