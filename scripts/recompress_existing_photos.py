#!/usr/bin/env python3
"""
既存 Storage 写真を無料ティア（長辺 2048・目標 ~2.5MB）で上書きするメンテ用。

使い方（リポジトリルート・apps/api/.env に SECRET があること）:

  $env:PYTHONPATH = "apps/api"
  python scripts/recompress_existing_photos.py

秘密をログ・コミットに出さない。本番他人データでは実行しない。
方針: docs/product/photo_storage.md
"""

from __future__ import annotations

import io
import logging
import sys
from pathlib import Path

# apps/api を import 可能に
_ROOT = Path(__file__).resolve().parents[1]
_API = _ROOT / "apps" / "api"
if str(_API) not in sys.path:
    sys.path.insert(0, str(_API))

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("recompress_photos")

_BUCKET = "photos"
_MAX_EDGE = 2048
_TARGET_BYTES = int(2.5 * 1024 * 1024)
_HARD_MAX = 10 * 1024 * 1024
_QUALITY_STEPS = (85, 75, 65, 55, 45)


def _load_api_dotenv() -> None:
    env_path = _API / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        key, _, val = s.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in __import__("os").environ:
            __import__("os").environ[key] = val


def compress_image(raw: bytes) -> tuple[bytes, dict[str, int | bool]]:
    from PIL import Image, ImageOps

    img = Image.open(io.BytesIO(raw))
    img = ImageOps.exif_transpose(img) or img
    img = img.convert("RGB")
    w, h = img.size
    edge = max(w, h)
    scaled = False
    if edge > _MAX_EDGE:
        scale = _MAX_EDGE / edge
        nw = max(1, int(round(w * scale)))
        nh = max(1, int(round(h * scale)))
        img = img.resize((nw, nh), Image.Resampling.LANCZOS)
        scaled = True
        w, h = nw, nh

    if (
        not scaled
        and len(raw) <= _TARGET_BYTES
        and len(raw) <= _HARD_MAX
    ):
        # すでに十分小さく、長辺も以内ならそのまま（形式は JPEG 化しうる）
        pass

    best: bytes | None = None
    for q in _QUALITY_STEPS:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=q, optimize=True)
        data = buf.getvalue()
        best = data
        if len(data) <= _TARGET_BYTES:
            break
    if best is None or len(best) > _HARD_MAX:
        raise RuntimeError("compress_failed")
    meta = {
        "width": w,
        "height": h,
        "bytes_in": len(raw),
        "bytes_out": len(best),
        "scaled": scaled,
    }
    return best, meta


def main() -> int:
    _load_api_dotenv()
    try:
        from app.infra.supabase_admin import (
            AdminNotConfiguredError,
            create_admin_client,
        )
    except ImportError:
        logger.error("apps/api の import に失敗。PYTHONPATH=apps/api を確認")
        return 1

    try:
        client = create_admin_client()
    except AdminNotConfiguredError:
        logger.error("SUPABASE_URL / SUPABASE_SECRET_KEY が未設定（apps/api/.env）")
        return 1

    try:
        from PIL import Image  # noqa: F401
    except ImportError:
        logger.error("Pillow が必要です: pip install Pillow")
        return 1

    resp = (
        client.table("photo")
        .select("photo_id,photo_thumbnail_url,photo_high_resolution_url")
        .order("photo_id")
        .execute()
    )
    rows = resp.data or []
    ok = 0
    skip = 0
    fail = 0

    for row in rows:
        photo_id = row.get("photo_id")
        path = (row.get("photo_thumbnail_url") or row.get("photo_high_resolution_url") or "").strip()
        if not path:
            logger.info("skip photo_id=%s (empty path)", photo_id)
            skip += 1
            continue
        try:
            raw = client.storage.from_(_BUCKET).download(path)
            if not raw:
                logger.warning("empty download photo_id=%s", photo_id)
                fail += 1
                continue
            out, meta = compress_image(raw)
            if meta["bytes_out"] >= meta["bytes_in"] and not meta["scaled"]:
                logger.info(
                    "keep photo_id=%s bytes=%s (already within tier)",
                    photo_id,
                    meta["bytes_in"],
                )
                # それでも JPEG に揃えるため上書きはする（HEIC 等対策）
            client.storage.from_(_BUCKET).upload(
                path,
                out,
                file_options={
                    "content-type": "image/jpeg",
                    "upsert": "true",
                },
            )
            logger.info(
                "ok photo_id=%s %s→%s bytes %sx%s scaled=%s",
                photo_id,
                meta["bytes_in"],
                meta["bytes_out"],
                meta["width"],
                meta["height"],
                meta["scaled"],
            )
            ok += 1
        except Exception:
            logger.exception("fail photo_id=%s", photo_id)
            fail += 1

    logger.info("done ok=%s skip=%s fail=%s", ok, skip, fail)
    return 0 if fail == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
