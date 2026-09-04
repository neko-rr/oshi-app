"""表示設定 HTTP（業務は display_settings_service）。"""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.deps.auth import AuthenticatedUser, get_access_token, get_current_user
from app.services import display_settings_service

router = APIRouter(tags=["display-settings"])

DateFormatMode = Literal["residence", "ui_locale", "iso"]
CurrencyFormatMode = Literal["residence", "ui_locale", "plain"]


class DisplaySettingsBody(BaseModel):
    text_scale: int = Field(ge=1, le=7)
    ui_density: int = Field(ge=1, le=7)
    list_sort: Literal["newest", "name", "created_at"]
    gallery_layout: Literal["grid", "large", "list"]
    landing_page: Literal["home", "gallery", "register"]
    # 居住地・TZ・通貨・登録開始は service 側で検証
    residence_region: str = Field(min_length=1, max_length=64)
    timezone_override: str | None = Field(default=None, max_length=64)
    date_format_mode: DateFormatMode
    currency_code_override: str | None = Field(default=None, max_length=3)
    currency_format_mode: CurrencyFormatMode
    register_start_step: str = Field(min_length=1, max_length=32)
    default_storage_location_id: int | None = Field(default=None, ge=1)
    gallery_show_name: bool = True
    gallery_show_tags: bool = True
    gallery_show_price: bool = True


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
        detail={"code": "INTERNAL_ERROR", "message": "表示設定の操作に失敗しました"},
    )


@router.get("/display-settings")
def get_display_settings(
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return display_settings_service.get_display_settings(
            members_id=user.members_id, access_token=access_token
        )
    except Exception as exc:
        raise _err(exc) from exc


@router.put("/display-settings")
def put_display_settings(
    body: DisplaySettingsBody,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return display_settings_service.save_display_settings(
            members_id=user.members_id,
            access_token=access_token,
            text_scale=body.text_scale,
            ui_density=body.ui_density,
            list_sort=body.list_sort,
            gallery_layout=body.gallery_layout,
            landing_page=body.landing_page,
            residence_region=body.residence_region,
            timezone_override=body.timezone_override,
            date_format_mode=body.date_format_mode,
            currency_code_override=body.currency_code_override,
            currency_format_mode=body.currency_format_mode,
            register_start_step=body.register_start_step,
            default_storage_location_id=body.default_storage_location_id,
            gallery_show_name=body.gallery_show_name,
            gallery_show_tags=body.gallery_show_tags,
            gallery_show_price=body.gallery_show_price,
        )
    except Exception as exc:
        raise _err(exc) from exc
