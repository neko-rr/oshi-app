"""FastAPI 認証依存。Supabase access token を JWKS で検証する。"""

from __future__ import annotations

from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.core.settings import get_settings

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedUser:
    """JWT から得た現在ユーザー。members_id = auth.users.id。"""

    members_id: str
    email: str | None = None


def verify_access_token(token: str) -> AuthenticatedUser:
    """Supabase 発行 JWT を JWKS（RS256/ES256）で検証する。

    Legacy JWT Secret（HS256）は使わない（auth.mdc / 公式非推奨）。
    """
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "トークンがありません"},
        )

    settings = get_settings()
    jwks_url = settings.resolved_jwks_url
    if not jwks_url:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "JWKS URL が未設定です（SUPABASE_URL または SUPABASE_JWKS_URL）",
            },
        )

    try:
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
            options={"require": ["sub", "exp"]},
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "トークンが無効です"},
        ) from None

    sub = payload.get("sub")
    if not sub or not isinstance(sub, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "sub がありません"},
        )
    email = payload.get("email")
    return AuthenticatedUser(
        members_id=sub,
        email=email if isinstance(email, str) else None,
    )


def get_access_token(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """Bearer アクセストークン（未提示は 401）。"""
    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "認証が必要です"},
        )
    return creds.credentials


def get_current_user(
    token: str = Depends(get_access_token),
) -> AuthenticatedUser:
    return verify_access_token(token)
