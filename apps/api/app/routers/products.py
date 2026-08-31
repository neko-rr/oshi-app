from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps.auth import AuthenticatedUser, get_access_token, get_current_user
from app.schemas.products import (
    CreateProductRequest,
    CreateProductResponse,
    PatchProductRequest,
)
from app.services.product_service import (
    create_product_for_member,
    delete_product_for_member,
    get_product_for_member,
    list_products_for_member,
    patch_product_for_member,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
def list_products(
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
    limit: int = Query(default=48, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    try:
        items = list_products_for_member(
            user.members_id,
            access_token=access_token,
            limit=limit,
            offset=offset,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        ) from exc
    return {
        "items": items,
        "members_id": user.members_id,
        "limit": limit,
        "offset": offset,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(
    body: CreateProductRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> CreateProductResponse:
    try:
        created = create_product_for_member(
            user.members_id,
            access_token=access_token,
            product_name=body.product_name,
            photo_id=body.photo_id,
            barcode_number=body.barcode_number,
            barcode_type=body.barcode_type,
            product_group_name=body.product_group_name,
            works_series_name=body.works_series_name,
            title=body.title,
            character_name=body.character_name,
            purchase_price=body.purchase_price,
            purchase_location=body.purchase_location,
            memo=body.memo,
            category_tag_id=body.category_tag_id,
            storage_location_id=body.storage_location_id,
            color_tag_slots=body.color_tag_slots,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "製品登録に失敗しました"},
        ) from exc
    return CreateProductResponse(**created)


@router.get("/{registered_product_id}")
def get_product(
    registered_product_id: int,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        detail = get_product_for_member(
            user.members_id,
            access_token=access_token,
            registered_product_id=registered_product_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        ) from exc
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "製品が見つかりません"},
        )
    return detail


@router.patch("/{registered_product_id}")
def patch_product(
    registered_product_id: int,
    body: PatchProductRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    fields: dict = {}
    data = body.model_dump(exclude_unset=True)
    for key in (
        "product_name",
        "product_group_name",
        "works_series_name",
        "title",
        "character_name",
        "purchase_price",
        "purchase_location",
        "memo",
        "barcode_number",
        "category_tag_id",
        "storage_location_id",
    ):
        if key in data and data[key] is not None:
            fields[key] = data[key]
    if data.get("clear_category_tag"):
        fields["category_tag_id"] = None
    if data.get("clear_storage_location"):
        fields["storage_location_id"] = None
    try:
        updated = patch_product_for_member(
            user.members_id,
            access_token=access_token,
            registered_product_id=registered_product_id,
            fields=fields,
            color_tag_slots=body.color_tag_slots,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        ) from exc
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "製品が見つかりません"},
        )
    return updated


@router.delete("/{registered_product_id}")
def delete_product(
    registered_product_id: int,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        ok = delete_product_for_member(
            user.members_id,
            access_token=access_token,
            registered_product_id=registered_product_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        ) from exc
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "製品が見つかりません"},
        )
    return {"ok": True}
