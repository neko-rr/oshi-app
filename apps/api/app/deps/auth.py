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
    """Supabase 発行 JWT を検証する。

    開発・テストで SUPABASE_JWT_SECRET があれば HS256 で検証。
    無ければ JWKS（SUPABASE_URL/auth/v1/.well-known/jwks.json）を試す。
    """
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "トークンがありません"},
        )

    settings = get_settings()
    secret = settings.supabase_jwt_secret
    try:
        if secret:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={"require": ["sub", "exp"]},
            )
        else:
            if not settings.supabase_url:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "code": "UNAUTHORIZED",
                        "message": "JWT 検証設定が未完了です（起きた後に SUPABASE_* を設定）",
                    },
                )
            jwks_url = (
                settings.supabase_url.rstrip("/")
                + "/auth/v1/.well-known/jwks.json"
            )
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


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> AuthenticatedUser:
    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "認証が必要です"},
        )
    return verify_access_token(creds.credentials)
