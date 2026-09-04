"""ギャラリー保存ビュー HTTP（業務は gallery_view_service）。"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.deps.auth import AuthenticatedUser, get_access_token, get_current_user
from app.services import gallery_view_service

router = APIRouter(tags=["gallery-views"])


class GalleryViewCreateBody(BaseModel):
    view_name: str = Field(min_length=1, max_length=40)
    q: str | None = None
    category_tag_ids: list[int] = Field(default_factory=list)
    storage_location_ids: list[int] = Field(default_factory=list)
    color_tag_slots: list[int] = Field(default_factory=list)
    list_sort: str = "newest"


class GalleryViewRenameBody(BaseModel):
    view_name: str = Field(min_length=1, max_length=40)


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
        detail={"code": "INTERNAL_ERROR", "message": "保存ビューの操作に失敗しました"},
    )


@router.get("/gallery-views")
def list_gallery_views(
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        items = gallery_view_service.list_gallery_views(
            members_id=user.members_id, access_token=access_token
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"items": items}


@router.post("/gallery-views")
def create_gallery_view(
    body: GalleryViewCreateBody,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return gallery_view_service.create_gallery_view(
            members_id=user.members_id,
            access_token=access_token,
            view_name=body.view_name,
            q=body.q,
            category_tag_ids=body.category_tag_ids,
            storage_location_ids=body.storage_location_ids,
            color_tag_slots=body.color_tag_slots,
            list_sort=body.list_sort,
        )
    except Exception as exc:
        raise _err(exc) from exc


@router.patch("/gallery-views/{gallery_view_id}")
def patch_gallery_view(
    gallery_view_id: int,
    body: GalleryViewRenameBody,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return gallery_view_service.rename_gallery_view(
            members_id=user.members_id,
            access_token=access_token,
            gallery_view_id=gallery_view_id,
            view_name=body.view_name,
        )
    except Exception as exc:
        raise _err(exc) from exc


@router.delete("/gallery-views/{gallery_view_id}")
def delete_gallery_view(
    gallery_view_id: int,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        gallery_view_service.delete_gallery_view(
            members_id=user.members_id,
            access_token=access_token,
            gallery_view_id=gallery_view_id,
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"ok": True}
