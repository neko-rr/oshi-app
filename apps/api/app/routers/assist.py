"""外部アシスト API（IO / 楽天）の入口。

実 HTTP はサービス側ゲートに従う。ここでは設計どおりの JSON を返すだけ。
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.deps.auth import AuthenticatedUser, get_current_user
from app.services.barcode_lookup_service import lookup_by_barcode, lookup_by_keyword
from app.services.io_intelligence_service import describe_image
from app.services.tag_extraction_service import extract_tags

router = APIRouter(prefix="/assist", tags=["assist"])


class DescribeImageRequest(BaseModel):
    image_source: str = Field(min_length=1, description="data URI または URL")
    raw_base64: str | None = None


class ExtractTagsRequest(BaseModel):
    description: str | None = None
    product_candidates: list[dict] | None = None
    image_base64: str | None = None


class BarcodeLookupRequest(BaseModel):
    barcode: str = Field(min_length=1)


class KeywordLookupRequest(BaseModel):
    keyword: str = Field(min_length=1)


@router.post("/vision/describe")
def assist_describe_image(
    body: DescribeImageRequest,
    _user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """Vision 説明（キー未設定・LIVE 無効時は soft status）。"""
    return describe_image(body.image_source, raw_base64=body.raw_base64)


@router.post("/tags/extract")
def assist_extract_tags(
    body: ExtractTagsRequest,
    _user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """タグ抽出（同上）。"""
    return extract_tags(
        body.product_candidates,
        body.description,
        image_base64=body.image_base64,
    )


@router.post("/barcode/lookup")
def assist_barcode_lookup(
    body: BarcodeLookupRequest,
    _user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """楽天バーコード検索（同上）。"""
    return lookup_by_barcode(body.barcode)


@router.post("/barcode/keyword")
def assist_keyword_lookup(
    body: KeywordLookupRequest,
    _user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """楽天キーワード検索（同上）。"""
    return lookup_by_keyword(body.keyword)
