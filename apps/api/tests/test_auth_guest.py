# TDD: ゲスト JWT は /me 可・業務 API は 403 REGISTRATION_REQUIRED。退会は可。
from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser, verify_access_token
from app.main import app

client = TestClient(app)

GUEST = AuthenticatedUser(
    members_id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    email=None,
    is_anonymous=True,
)
AUTH = {"Authorization": "Bearer fake-jwt"}


def test_me_returns_is_anonymous_for_guest() -> None:
    with patch("app.deps.auth.verify_access_token", return_value=GUEST):
        res = client.get("/me", headers=AUTH)
    assert res.status_code == 200
    data = res.json()
    assert data["members_id"] == GUEST.members_id
    assert data["is_anonymous"] is True


def test_guest_products_list_requires_registration() -> None:
    with patch("app.deps.auth.verify_access_token", return_value=GUEST):
        res = client.get("/products", headers=AUTH)
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "REGISTRATION_REQUIRED"


def test_guest_photos_post_requires_registration() -> None:
    with patch("app.deps.auth.verify_access_token", return_value=GUEST):
        res = client.post("/photos", headers=AUTH, files={"file": ("x.jpg", b"x", "image/jpeg")})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "REGISTRATION_REQUIRED"


def test_guest_account_delete_allowed() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=GUEST),
        patch(
            "app.routers.account.account_delete_service.delete_account_for_member",
            return_value=None,
        ) as mocked,
    ):
        res = client.request(
            "DELETE",
            "/account",
            headers=AUTH,
            json={"confirmation": "DELETE"},
        )
    assert res.status_code == 200
    assert mocked.call_args.kwargs["members_id"] == GUEST.members_id


def test_verify_reads_is_anonymous_claim() -> None:
    from unittest.mock import MagicMock

    signing_key = MagicMock()
    signing_key.key = "public-key-material"
    jwks_client = MagicMock()
    jwks_client.get_signing_key_from_jwt.return_value = signing_key

    with (
        patch("app.deps.auth.get_settings") as settings,
        patch("app.deps.auth.PyJWKClient", return_value=jwks_client),
        patch(
            "app.deps.auth.jwt.decode",
            return_value={
                "sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                "is_anonymous": True,
                "exp": 9999999999,
            },
        ),
    ):
        settings.return_value.resolved_jwks_url = (
            "https://example.supabase.co/auth/v1/.well-known/jwks.json"
        )
        user = verify_access_token("header.payload.sig")
    assert user.is_anonymous is True
