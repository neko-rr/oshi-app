"""データ書き出し HTTP（業務は export_service）。"""

from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.deps.auth import AuthenticatedUser, get_access_token, get_current_user
from app.services import export_service

router = APIRouter(tags=["exports"])


class ExportCreateBody(BaseModel):
    kind: str = Field(description="text | media")


def _err(exc: Exception) -> HTTPException:
    if isinstance(exc, export_service.ExportBusyError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EXPORT_BUSY", "message": str(exc)},
        )
    if isinstance(exc, export_service.ExportNotFoundError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(exc)},
        )
    if isinstance(exc, export_service.ExportExpiredError):
        return HTTPException(
            status_code=status.HTTP_410_GONE,
            detail={"code": "EXPORT_EXPIRED", "message": str(exc)},
        )
    if isinstance(exc, export_service.ExportNotReadyError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EXPORT_NOT_READY", "message": str(exc)},
        )
    if isinstance(exc, ValueError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        )
    if isinstance(exc, RuntimeError) and str(exc) == "supabase_not_configured":
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "Supabase 未設定"},
        )
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={"code": "INTERNAL_ERROR", "message": "書き出しに失敗しました"},
    )


@router.post("/exports")
def create_export(
    body: ExportCreateBody,
    background_tasks: BackgroundTasks,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    kind = (body.kind or "").strip()
    try:
        if kind == "media":
            job = export_service.create_export(
                members_id=user.members_id,
                access_token=access_token,
                kind=kind,
                run_async=True,
            )
            background_tasks.add_task(
                export_service.run_export_job,
                members_id=user.members_id,
                access_token=access_token,
                export_id=job["export_id"],
                kind=kind,
            )
            return job
        return export_service.create_export(
            members_id=user.members_id,
            access_token=access_token,
            kind=kind,
            run_async=False,
        )
    except Exception as exc:
        raise _err(exc) from exc


@router.get("/exports/{export_id}")
def get_export(
    export_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> dict:
    try:
        return export_service.get_export(
            members_id=user.members_id,
            access_token=access_token,
            export_id=export_id,
        )
    except Exception as exc:
        raise _err(exc) from exc


@router.get("/exports/{export_id}/file")
def download_export_file(
    export_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
) -> Response:
    try:
        content, filename = export_service.download_export_file(
            members_id=user.members_id,
            access_token=access_token,
            export_id=export_id,
        )
    except Exception as exc:
        raise _err(exc) from exc
    return Response(
        content=content,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
