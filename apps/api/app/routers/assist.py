"""外部アシスト API（IO / 楽天）の入口。

実 HTTP はサービス側ゲートに従う。ここでは設計どおりの JSON を返すだけ。
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.settings import get_settings
from app.deps.auth import AuthenticatedUser, get_current_user, require_permanent_user
from app.services.barcode_lookup_service import lookup_by_barcode, lookup_by_keyword
from app.services.guest_lookup_quota import consume_lookup
from app.services.io_intelligence_service import describe_image
from app.services.tag_extraction_service import extract_tags
from app.services.turnstile_verify import verify_turnstile_token

router = APIRouter(prefix="/assist", tags=["assist"])


class DescribeImageRequest(BaseModel):
    image_source: str = Field(min_length=1, description="data URI または URL")
    raw_base64: str | None = None
    captcha_token: str | None = None


class ExtractTagsRequest(BaseModel):
    description: str | None = None
    product_candidates: list[dict] | None = None
    image_base64: str | None = None


class BarcodeLookupRequest(BaseModel):
    barcode: str = Field(min_length=1)
    captcha_token: str | None = None


def _raise_guest_quota() -> None:
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "code": "GUEST_LOOKUP_QUOTA",
            "message": "ゲストの照合回数の上限です。しばらく待つか、本登録してください",
        },
    )


def _guest_trial_remaining(user: AuthenticatedUser, token: str | None) -> int | None:
    """ゲストなら残回数。本登録なら None。失敗時は例外。"""
    if not user.is_anonymous:
        return None
    code = _guest_captcha_error(token)
    if code:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": code, "message": "確認を完了してください"},
        )
    decision = consume_lookup(user.members_id)
    if not decision.allowed:
        _raise_guest_quota()
    return decision.remaining


def _guest_captcha_error(token: str | None) -> str | None:
    """ゲスト照合の CAPTCHA。問題なければ None。"""
    cleaned = (token or "").strip()
    if not cleaned:
        return "CAPTCHA_REQUIRED"
    secret = get_settings().turnstile_secret_key.strip()
    if not secret:
        return "CAPTCHA_NOT_CONFIGURED"
    if not verify_turnstile_token(cleaned, secret):
        return "CAPTCHA_INVALID"
    return None


class KeywordLookupRequest(BaseModel):
    keyword: str = Field(min_length=1)


@router.post("/vision/describe")
def assist_describe_image(
    body: DescribeImageRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """写真抽出。ゲストは CAPTCHA 成功かつ楽天照合と合計1時間3回まで。"""
    remaining = _guest_trial_remaining(user, body.captcha_token)
    payload = dict(describe_image(body.image_source, raw_base64=body.raw_base64))
    if remaining is not None:
        payload["guest_trial"] = True
        payload["lookups_remaining"] = remaining
    return payload


@router.post("/tags/extract")
def assist_extract_tags(
    body: ExtractTagsRequest,
    _user: AuthenticatedUser = Depends(require_permanent_user),
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
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    """楽天バーコード検索。ゲストは CAPTCHA 成功かつ写真抽出と合計1時間3回まで。"""
    remaining = _guest_trial_remaining(user, body.captcha_token)
    payload = dict(lookup_by_barcode(body.barcode))
    if remaining is not None:
        payload["guest_trial"] = True
        payload["lookups_remaining"] = remaining
    return payload


@router.post("/barcode/keyword")
def assist_keyword_lookup(
    body: KeywordLookupRequest,
    _user: AuthenticatedUser = Depends(require_permanent_user),
) -> dict:
    """楽天キーワード検索（同上）。"""
    return lookup_by_keyword(body.keyword)
