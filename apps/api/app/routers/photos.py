from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.deps.auth import AuthenticatedUser, get_access_token, get_current_user
from app.services.photo_service import create_photo_for_member

router = APIRouter(prefix="/photos", tags=["photos"])

_MAX_BYTES = 10 * 1024 * 1024


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_photo(
    user: AuthenticatedUser = Depends(get_current_user),
    access_token: str = Depends(get_access_token),
    file: UploadFile = File(...),
) -> dict:
    """正面写真アップロード（IO Vision は呼ばない）。"""
    raw = await file.read()
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "画像ファイルが空です"},
        )
    if len(raw) > _MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "ファイルサイズは 10MB 以下にしてください",
            },
        )
    try:
        return create_photo_for_member(
            user.members_id,
            access_token=access_token,
            file_bytes=raw,
            content_type=file.content_type or "application/octet-stream",
            filename=file.filename or "upload.jpg",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        ) from exc
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "写真登録に失敗しました"},
        ) from None
