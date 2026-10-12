# TDD: ゲストの楽天照合と写真抽出は、CAPTCHA 成功かつ合計1時間3回まで。
from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app
from app.services.guest_lookup_quota import consume_lookup, reset_guest_lookup_quota

client = TestClient(app)

GUEST = AuthenticatedUser(
    members_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    email=None,
    is_anonymous=True,
)
PERM = AuthenticatedUser(
    members_id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    email="p@example.com",
    is_anonymous=False,
)
AUTH = {"Authorization": "Bearer fake-jwt"}
LOOKUP = {"status": "success", "items": [{"name": "sample"}], "source": "rakuten"}


class _TurnstileSettings:
    turnstile_secret_key = "test-secret"


def setup_function() -> None:
    reset_guest_lookup_quota()


def test_quota_allows_three_then_blocks_within_hour() -> None:
    member = "cccccccc-cccc-cccc-cccc-cccccccccccc"
    now = 1_000_000.0
    for i in range(3):
        decision = consume_lookup(member, now=now + i)
        assert decision.allowed is True
        assert decision.remaining == 2 - i
    blocked = consume_lookup(member, now=now + 10)
    assert blocked.allowed is False
    assert blocked.remaining == 0
    later = consume_lookup(member, now=now + 3603)
    assert later.allowed is True
    assert later.remaining == 2


def test_guest_lookup_without_captcha_does_not_call_rakuten() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=GUEST),
        patch("app.routers.assist.lookup_by_barcode") as lookup,
    ):
        res = client.post(
            "/assist/barcode/lookup",
            headers=AUTH,
            json={"barcode": "4901234567890"},
        )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "CAPTCHA_REQUIRED"
    lookup.assert_not_called()


def test_guest_lookup_rejects_bad_captcha() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=GUEST),
        patch("app.routers.assist.lookup_by_barcode") as lookup,
        patch("app.routers.assist.get_settings", return_value=_TurnstileSettings()),
        patch("app.routers.assist.verify_turnstile_token", return_value=False),
    ):
        res = client.post(
            "/assist/barcode/lookup",
            headers=AUTH,
            json={"barcode": "4901234567890", "captcha_token": "bad"},
        )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "CAPTCHA_INVALID"
    lookup.assert_not_called()


def test_guest_lookup_allows_three_with_valid_captcha() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=GUEST),
        patch("app.routers.assist.lookup_by_barcode", return_value=dict(LOOKUP)) as lookup,
        patch("app.routers.assist.get_settings", return_value=_TurnstileSettings()),
        patch("app.routers.assist.verify_turnstile_token", return_value=True),
    ):
        for _ in range(3):
            res = client.post(
                "/assist/barcode/lookup",
                headers=AUTH,
                json={"barcode": "4901234567890", "captcha_token": "ok"},
            )
            assert res.status_code == 200
            assert res.json()["guest_trial"] is True
        blocked = client.post(
            "/assist/barcode/lookup",
            headers=AUTH,
            json={"barcode": "4901234567890", "captcha_token": "ok"},
        )
    assert blocked.status_code == 429
    assert blocked.json()["error"]["code"] == "GUEST_LOOKUP_QUOTA"
    assert lookup.call_count == 3


def test_guest_keyword_stays_registration_required() -> None:
    with patch("app.deps.auth.verify_access_token", return_value=GUEST):
        keyword = client.post(
            "/assist/barcode/keyword",
            headers=AUTH,
            json={"keyword": "badge"},
        )
    assert keyword.status_code == 403
    assert keyword.json()["error"]["code"] == "REGISTRATION_REQUIRED"


def test_guest_vision_without_captcha_does_not_call_model() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=GUEST),
        patch("app.routers.assist.describe_image") as vision,
    ):
        res = client.post(
            "/assist/vision/describe",
            headers=AUTH,
            json={"image_source": "data:image/jpeg;base64,aa"},
        )
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "CAPTCHA_REQUIRED"
    vision.assert_not_called()


def test_guest_barcode_and_vision_share_hourly_quota() -> None:
    vision_body = {"status": "success", "structured_data": {"description": "front"}}
    with (
        patch("app.deps.auth.verify_access_token", return_value=GUEST),
        patch("app.routers.assist.lookup_by_barcode", return_value=dict(LOOKUP)),
        patch("app.routers.assist.describe_image", return_value=dict(vision_body)) as vision,
        patch("app.routers.assist.get_settings", return_value=_TurnstileSettings()),
        patch("app.routers.assist.verify_turnstile_token", return_value=True),
    ):
        for _ in range(2):
            res = client.post(
                "/assist/barcode/lookup",
                headers=AUTH,
                json={"barcode": "4901234567890", "captcha_token": "ok"},
            )
            assert res.status_code == 200
        photo = client.post(
            "/assist/vision/describe",
            headers=AUTH,
            json={
                "image_source": "data:image/jpeg;base64,aa",
                "captcha_token": "ok",
            },
        )
        assert photo.status_code == 200
        assert photo.json()["guest_trial"] is True
        assert photo.json()["lookups_remaining"] == 0
        blocked = client.post(
            "/assist/vision/describe",
            headers=AUTH,
            json={
                "image_source": "data:image/jpeg;base64,aa",
                "captcha_token": "ok",
            },
        )
    assert blocked.status_code == 429
    assert blocked.json()["error"]["code"] == "GUEST_LOOKUP_QUOTA"
    assert vision.call_count == 1


def test_permanent_lookup_skips_captcha_and_quota() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=PERM),
        patch("app.routers.assist.lookup_by_barcode", return_value=dict(LOOKUP)) as lookup,
        patch("app.routers.assist.verify_turnstile_token") as captcha,
    ):
        for _ in range(4):
            res = client.post(
                "/assist/barcode/lookup",
                headers=AUTH,
                json={"barcode": "4901234567890"},
            )
            assert res.status_code == 200
            assert "guest_trial" not in res.json()
    assert lookup.call_count == 4
    captcha.assert_not_called()
