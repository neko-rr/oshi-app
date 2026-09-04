from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps.auth import AuthenticatedUser, get_access_token, get_current_user
from app.schemas.products import (
    BulkPatchProductsRequest,
    CreateProductRequest,
    CreateProductResponse,
    PatchProductRequest,
)
from app.services.product_list_filters import parse_positive_id_list
from app.services.product_service import (
    bulk_patch_products_for_member,
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
    q: str | None = Query(default=None, max_length=200),
    barcode: str | None = Query(
        default=None,
        max_length=64,
        description="barcode_number 完全一致（自分の購入済み判定用）",
    ),
    category_tag_id: str | None = Query(
        default=None,
        max_length=200,
        description="カンマ区切り category_tag_id（同種 OR）",
    ),
    storage_location_id: str | None = Query(
        default=None,
        max_length=200,
        description="カンマ区切り storage_location_id（同種 OR）",
    ),
    color_tag_slot: str | None = Query(
        default=None,
        max_length=64,
        description="カンマ区切り color_tag slot 1..7（同種 OR）",
    ),
    sort: str | None = Query(
        default="newest",
        description="newest / name / created_at",
    ),
) -> dict:
    try:
        category_tag_ids = parse_positive_id_list(
            category_tag_id, field="category_tag_id"
        )
        storage_location_ids = parse_positive_id_list(
            storage_location_id, field="storage_location_id"
        )
        color_tag_slots = parse_positive_id_list(
            color_tag_slot, field="color_tag_slot", max_value=7, max_items=7
        )
        items = list_products_for_member(
            user.members_id,
            access_token=access_token,
            limit=limit,
            offset=offset,
            q=q,
            barcode=barcode,
            category_tag_ids=category_tag_ids or None,
            storage_location_ids=storage_location_ids or None,
            color_tag_slots=color_tag_slots or None,
            sort=sort,
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
        "q": q,
        "barcode": barcode,
        "category_tag_ids": category_tag_ids,
        "storage_location_ids": storage_location_ids,
        "color_tag_slots": color_tag_slots,
        "sort": sort or "newest",
        "has_more": len(items) >= limit,
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
            currency_code=body.currency_code,
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


@router.patch("/bulk")
def bulk_patch_products(
    body: BulkPatchProductsRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return bulk_patch_products_for_member(
            user.members_id,
            access_token=access_token,
            registered_product_ids=body.registered_product_ids,
            storage_location_id=body.storage_location_id,
            clear_storage_location=body.clear_storage_location,
            category_tag_id=body.category_tag_id,
            clear_category_tag=body.clear_category_tag,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "一括更新に失敗しました"},
        ) from exc


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
        "currency_code",
        "purchase_location",
        "memo",
        "barcode_number",
        "category_tag_id",
        "storage_location_id",
    ):
        if key not in data:
            continue
        # purchase_price / currency_code は明示 null でクリア可
        if data[key] is None and key not in ("purchase_price", "currency_code"):
            continue
        fields[key] = data[key]
    # 価格クリア時は記録通貨も落とす（ゴミ通貨だけ残さない）
    if "purchase_price" in fields and fields["purchase_price"] is None:
        fields["currency_code"] = None
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
