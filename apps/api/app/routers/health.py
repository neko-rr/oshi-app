from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.deps.auth import AuthenticatedUser, get_current_user
from fastapi import Depends

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


class MeResponse(BaseModel):
    members_id: str
    email: str | None = None


router_me = APIRouter(tags=["me"])


@router_me.get("/me", response_model=MeResponse)
def me(user: AuthenticatedUser = Depends(get_current_user)) -> MeResponse:
    return MeResponse(members_id=user.members_id, email=user.email)


def unauthorized_payload(detail: object) -> JSONResponse:
    """FastAPI HTTPException.detail を共通 error 形へ。"""
    if isinstance(detail, dict) and "code" in detail:
        return JSONResponse(
            status_code=401,
            content={"error": detail},
        )
    return JSONResponse(
        status_code=401,
        content={
            "error": {
                "code": "UNAUTHORIZED",
                "message": str(detail) if detail else "認証が必要です",
            }
        },
    )
