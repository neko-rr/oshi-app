from __future__ import annotations

from pydantic import BaseModel, Field


class ExternalRefInput(BaseModel):
    """製品に紐づく外部参照（楽天・任意URL）。"""

    source: str = Field(min_length=1, max_length=32)
    product_url: str = Field(min_length=1, max_length=2000)
    external_item_code: str | None = Field(default=None, max_length=200)
    shop_name: str | None = Field(default=None, max_length=200)
    label: str | None = Field(default=None, max_length=100)
    is_primary: bool = False


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
    currency_code: str | None = Field(default=None, max_length=3)
    purchase_location: str | None = None
    purchase_date: str | None = Field(default=None, max_length=32)
    memo: str | None = None
    category_tag_id: int | None = None
    storage_location_id: int | None = None
    color_tag_slots: list[int] | None = None
    registration_quantity: int | None = Field(default=None, ge=1, le=999)
    sales_desired_flag: bool | int | None = None
    sales_desired_quantity: int | None = Field(default=None, ge=0, le=999)
    want_object_flag: bool | int | None = None
    # True のとき交換OK欄はユーザー手調整（自動付与しない）
    sales_desired_user_touched: bool = False
    external_refs: list[ExternalRefInput] | None = None


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
    currency_code: str | None = Field(default=None, max_length=3)
    purchase_location: str | None = None
    purchase_date: str | None = Field(default=None, max_length=32)
    memo: str | None = None
    barcode_number: str | None = None
    category_tag_id: int | None = None
    storage_location_id: int | None = None
    registration_quantity: int | None = Field(default=None, ge=1, le=999)
    sales_desired_flag: bool | int | None = None
    sales_desired_quantity: int | None = Field(default=None, ge=0, le=999)
    want_object_flag: bool | int | None = None
    sales_desired_user_touched: bool = False
    # True のときだけ NULL クリアを許可
    clear_category_tag: bool = False
    clear_storage_location: bool = False
    clear_purchase_date: bool = False
    color_tag_slots: list[int] | None = None
    # 明示指定時のみ全置換（空配列で全削除）
    external_refs: list[ExternalRefInput] | None = None


class BulkPatchProductsRequest(BaseModel):
    """PATCH /products/bulk — 複数製品の一括更新（収納・カテゴリ）。"""

    registered_product_ids: list[int] = Field(min_length=1, max_length=100)
    storage_location_id: int | None = Field(default=None, ge=1)
    clear_storage_location: bool = False
    category_tag_id: int | None = Field(default=None, ge=1)
    clear_category_tag: bool = False
