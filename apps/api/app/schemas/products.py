from __future__ import annotations

from pydantic import BaseModel, Field


class CreateProductRequest(BaseModel):
    """POST /products ボディ。"""

    product_name: str = Field(min_length=1)
    photo_id: int | None = None
    barcode_number: str | None = None
    barcode_type: str | None = None
    product_group_name: str | None = None
    works_series_name: str | None = None
    title: str | None = None
    character_name: str | None = None
    purchase_price: int | None = None
    purchase_location: str | None = None
    memo: str | None = None
    category_tag_id: int | None = None
    storage_location_id: int | None = None
    color_tag_slots: list[int] | None = None


class CreateProductResponse(BaseModel):
    registered_product_id: int
    product_name: str
    photo_id: int | None = None


class PatchProductRequest(BaseModel):
    """PATCH /products/{id} — スカラーとタグ付け。"""

    product_name: str | None = None
    product_group_name: str | None = None
    works_series_name: str | None = None
    title: str | None = None
    character_name: str | None = None
    purchase_price: int | None = None
    purchase_location: str | None = None
    memo: str | None = None
    barcode_number: str | None = None
    category_tag_id: int | None = None
    storage_location_id: int | None = None
    # True のときだけ NULL クリアを許可
    clear_category_tag: bool = False
    clear_storage_location: bool = False
    color_tag_slots: list[int] | None = None
