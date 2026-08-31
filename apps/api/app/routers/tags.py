from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.deps.auth import AuthenticatedUser, get_access_token, get_current_user
from app.services import tag_service

router = APIRouter(tags=["tags"])


class ColorTagEntry(BaseModel):
    slot: int = Field(ge=1, le=7)
    color_tag_name: str
    color_tag_color: str


class ColorTagsSaveRequest(BaseModel):
    entries: list[ColorTagEntry]


class CategoryCreate(BaseModel):
    category_tag_name: str
    category_tag_color: str = "#6c757d"
    category_tag_icon: str = "bi-tag"


class CategoryUpdate(BaseModel):
    category_tag_name: str
    category_tag_color: str
    category_tag_icon: str = "bi-tag"


class StorageLocationCreate(BaseModel):
    storage_location_name: str
    storage_location_icon: str = "bi-geo"


class StorageLocationUpdate(BaseModel):
    storage_location_name: str
    storage_location_icon: str = "bi-geo"


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
        detail={"code": "INTERNAL_ERROR", "message": "タグ操作に失敗しました"},
    )


@router.get("/color-tags")
def get_color_tags(
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        items = tag_service.list_color_tags(
            members_id=user.members_id, access_token=access_token
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"items": items}


@router.put("/color-tags")
def put_color_tags(
    body: ColorTagsSaveRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        items = tag_service.save_color_tags(
            members_id=user.members_id,
            access_token=access_token,
            entries=[e.model_dump() for e in body.entries],
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"items": items}


@router.get("/category-tags")
def get_category_tags(
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        items = tag_service.list_category_tags(
            members_id=user.members_id, access_token=access_token
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"items": items}


@router.post("/category-tags", status_code=status.HTTP_201_CREATED)
def post_category_tag(
    body: CategoryCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        item = tag_service.create_category_tag(
            members_id=user.members_id,
            access_token=access_token,
            name=body.category_tag_name,
            color=body.category_tag_color,
            icon=body.category_tag_icon,
        )
    except Exception as exc:
        raise _err(exc) from exc
    return item


@router.patch("/category-tags/{category_tag_id}")
def patch_category_tag(
    category_tag_id: int,
    body: CategoryUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        tag_service.update_category_tag(
            members_id=user.members_id,
            access_token=access_token,
            category_tag_id=category_tag_id,
            name=body.category_tag_name,
            color=body.category_tag_color,
            icon=body.category_tag_icon,
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"ok": True}


@router.delete("/category-tags/{category_tag_id}")
def remove_category_tag(
    category_tag_id: int,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        tag_service.delete_category_tag(
            members_id=user.members_id,
            access_token=access_token,
            category_tag_id=category_tag_id,
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"ok": True}


@router.get("/storage-locations")
def get_storage_locations(
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        items = tag_service.list_storage_locations(
            members_id=user.members_id, access_token=access_token
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"items": items}


@router.post("/storage-locations", status_code=status.HTTP_201_CREATED)
def post_storage_location(
    body: StorageLocationCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        item = tag_service.create_storage_location(
            members_id=user.members_id,
            access_token=access_token,
            name=body.storage_location_name,
            icon=body.storage_location_icon,
        )
    except Exception as exc:
        raise _err(exc) from exc
    return item


@router.patch("/storage-locations/{storage_location_id}")
def patch_storage_location(
    storage_location_id: int,
    body: StorageLocationUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        tag_service.update_storage_location(
            members_id=user.members_id,
            access_token=access_token,
            storage_location_id=storage_location_id,
            name=body.storage_location_name,
            icon=body.storage_location_icon,
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"ok": True}


@router.delete("/storage-locations/{storage_location_id}")
def remove_storage_location(
    storage_location_id: int,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        tag_service.delete_storage_location(
            members_id=user.members_id,
            access_token=access_token,
            storage_location_id=storage_location_id,
        )
    except Exception as exc:
        raise _err(exc) from exc
    return {"ok": True}
