"""データ書き出しジョブ（text 同期 / media 非同期）。再取り込みはしない。"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from app.infra.supabase_user import create_user_client
from app.services.export_manifest import build_export_zip_bytes, build_manifest

logger = logging.getLogger(__name__)

_PHOTOS_BUCKET = "photos"
_ARTIFACT_BUCKET = "exports"
_PAGE_SIZE = 100
_TTL_HOURS = 24
_STALE_MINUTES = 30
_MAX_MEDIA_PHOTOS = 1000

SELECT_JOB = (
    "data_export_id,members_id,kind,status,storage_path,error_code,"
    "created_at,updated_at,expires_at"
)


class ExportBusyError(Exception):
    """media 書き出しが既に進行中。"""


class ExportNotFoundError(Exception):
    """ジョブが無い／他人のもの。"""


class ExportExpiredError(Exception):
    """TTL 切れ。"""


class ExportNotReadyError(Exception):
    """まだダウンロードできない。"""


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_ts(raw: Any) -> datetime | None:
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw if raw.tzinfo else raw.replace(tzinfo=timezone.utc)
    text = str(raw).replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _job_to_api(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "export_id": str(row["data_export_id"]),
        "kind": row["kind"],
        "status": row["status"],
        "error_code": row.get("error_code"),
        "created_at": row.get("created_at"),
        "expires_at": row.get("expires_at"),
    }


def _fetch_all_rows(
    client: Any,
    table: str,
    *,
    members_id: str,
    order_col: str | None = None,
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    offset = 0
    while True:
        query = client.table(table).select("*").eq("members_id", members_id)
        if order_col:
            query = query.order(order_col)
        query = query.range(offset, offset + _PAGE_SIZE - 1)
        response = query.execute()
        if getattr(response, "error", None):
            logger.error("%s list error: %s", table, response.error)
            raise RuntimeError(f"{table} の取得に失敗しました")
        data = response.data if hasattr(response, "data") else None
        if not isinstance(data, list) or not data:
            break
        for row in data:
            if isinstance(row, dict):
                out.append(row)
        if len(data) < _PAGE_SIZE:
            break
        offset += _PAGE_SIZE
    return out


def _enrich_products(
    products: list[dict[str, Any]],
    *,
    category_tags: list[dict[str, Any]],
    storage_locations: list[dict[str, Any]],
    product_color_tags: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    cat_names = {
        int(r["category_tag_id"]): r.get("category_tag_name")
        for r in category_tags
        if r.get("category_tag_id") is not None
    }
    storage_names = {
        int(r["storage_location_id"]): r.get("storage_location_name")
        for r in storage_locations
        if r.get("storage_location_id") is not None
    }
    slots_by_product: dict[int, list[int]] = {}
    for link in product_color_tags:
        pid = link.get("registered_product_id")
        slot = link.get("slot")
        if pid is None or slot is None:
            continue
        slots_by_product.setdefault(int(pid), []).append(int(slot))

    enriched: list[dict[str, Any]] = []
    for row in products:
        item = dict(row)
        # members_id はテナント秘密ではないが、書き出しに不要
        item.pop("members_id", None)
        cat_id = item.get("category_tag_id")
        if cat_id is not None:
            item["category_tag_name"] = cat_names.get(int(cat_id))
        storage_id = item.get("storage_location_id")
        if storage_id is not None:
            item["storage_location_name"] = storage_names.get(int(storage_id))
        pid = item.get("registered_product_id")
        if pid is not None:
            slots = sorted(set(slots_by_product.get(int(pid), [])))
            item["color_tag_slots"] = slots
        enriched.append(item)
    return enriched


def _collect_snapshot(
    *,
    members_id: str,
    access_token: str,
) -> dict[str, list[dict[str, Any]]]:
    client = create_user_client(access_token)
    category_tags = _fetch_all_rows(
        client, "category_tag", members_id=members_id, order_col="display_order"
    )
    storage_locations = _fetch_all_rows(
        client,
        "storage_location",
        members_id=members_id,
        order_col="display_order",
    )
    color_tags = _fetch_all_rows(
        client, "color_tag", members_id=members_id, order_col="slot"
    )
    products = _fetch_all_rows(
        client,
        "registered_product",
        members_id=members_id,
        order_col="registered_product_id",
    )
    product_color_tags = _fetch_all_rows(
        client, "registered_product_color_tag", members_id=members_id
    )
    photos = _fetch_all_rows(
        client, "photo", members_id=members_id, order_col="photo_id"
    )
    for rows in (category_tags, storage_locations, color_tags, product_color_tags, photos):
        for row in rows:
            row.pop("members_id", None)
    products = _enrich_products(
        products,
        category_tags=category_tags,
        storage_locations=storage_locations,
        product_color_tags=product_color_tags,
    )
    return {
        "category_tags": category_tags,
        "storage_locations": storage_locations,
        "color_tags": color_tags,
        "products": products,
        "product_color_tags": product_color_tags,
        "photos": photos,
    }


def _download_photo_bytes(
    client: Any, *, object_path: str
) -> bytes | None:
    if not object_path or object_path.startswith("http"):
        return None
    try:
        data = client.storage.from_(_PHOTOS_BUCKET).download(object_path)
    except Exception:
        logger.exception("写真ダウンロード失敗 path=%s", object_path)
        return None
    if isinstance(data, (bytes, bytearray)):
        return bytes(data)
    return None


def _build_zip_for_kind(
    *,
    kind: str,
    members_id: str,
    access_token: str,
) -> bytes:
    snap = _collect_snapshot(members_id=members_id, access_token=access_token)
    include_media = kind == "media"
    if include_media and len(snap["photos"]) > _MAX_MEDIA_PHOTOS:
        raise ValueError(
            f"写真が多すぎます（上限 {_MAX_MEDIA_PHOTOS} 枚）。テキスト書き出しをご利用ください"
        )

    manifest = build_manifest(
        kind=kind,
        products=snap["products"],
        category_tags=snap["category_tags"],
        storage_locations=snap["storage_locations"],
        color_tags=snap["color_tags"],
        product_color_tags=snap["product_color_tags"],
        photos=snap["photos"],
        include_media_paths=include_media,
    )

    media_files: dict[str, bytes] = {}
    if include_media:
        client = create_user_client(access_token)
        for photo_wrap in manifest["entities"]["photos"]:
            core = photo_wrap.get("core") or {}
            media_path = core.get("media_path")
            storage_path = (
                core.get("photo_high_resolution_path")
                or core.get("photo_thumbnail_path")
            )
            if not media_path or not storage_path:
                continue
            blob = _download_photo_bytes(client, object_path=str(storage_path))
            if blob:
                media_files[str(media_path)] = blob

    return build_export_zip_bytes(manifest=manifest, media_files=media_files)


def _upload_artifact(
    *,
    access_token: str,
    members_id: str,
    export_id: str,
    zip_bytes: bytes,
) -> str:
    client = create_user_client(access_token)
    object_path = f"{members_id}/{export_id}.zip"
    try:
        client.storage.from_(_ARTIFACT_BUCKET).upload(
            object_path,
            zip_bytes,
            file_options={
                "content-type": "application/zip",
                "upsert": "true",
            },
        )
    except Exception:
        logger.exception("書き出し ZIP アップロード失敗 export_id=%s", export_id)
        raise RuntimeError("書き出しファイルの保存に失敗しました") from None
    return object_path


def _update_job(
    *,
    access_token: str,
    members_id: str,
    export_id: str,
    fields: dict[str, Any],
) -> None:
    client = create_user_client(access_token)
    payload = {**fields, "updated_at": _now().isoformat()}
    client.table("data_export").update(payload).eq(
        "members_id", members_id
    ).eq("data_export_id", export_id).execute()


def _get_job_row(
    *,
    access_token: str,
    members_id: str,
    export_id: str,
) -> dict[str, Any] | None:
    client = create_user_client(access_token)
    response = (
        client.table("data_export")
        .select(SELECT_JOB)
        .eq("members_id", members_id)
        .eq("data_export_id", export_id)
        .limit(1)
        .execute()
    )
    data = response.data if hasattr(response, "data") else None
    if not isinstance(data, list) or not data:
        return None
    row = data[0]
    return row if isinstance(row, dict) else None


def _fail_stale_media_jobs(*, access_token: str, members_id: str) -> None:
    client = create_user_client(access_token)
    cutoff = (_now() - timedelta(minutes=_STALE_MINUTES)).isoformat()
    (
        client.table("data_export")
        .update(
            {
                "status": "failed",
                "error_code": "STALE",
                "updated_at": _now().isoformat(),
            }
        )
        .eq("members_id", members_id)
        .eq("kind", "media")
        .in_("status", ["pending", "running"])
        .lt("updated_at", cutoff)
        .execute()
    )


def _has_active_media(*, access_token: str, members_id: str) -> bool:
    client = create_user_client(access_token)
    response = (
        client.table("data_export")
        .select("data_export_id")
        .eq("members_id", members_id)
        .eq("kind", "media")
        .in_("status", ["pending", "running"])
        .limit(1)
        .execute()
    )
    data = response.data if hasattr(response, "data") else None
    return isinstance(data, list) and len(data) > 0


def run_export_job(
    *,
    members_id: str,
    access_token: str,
    export_id: str,
    kind: str,
) -> None:
    """BackgroundTasks から呼ぶ実処理。"""
    try:
        _update_job(
            access_token=access_token,
            members_id=members_id,
            export_id=export_id,
            fields={"status": "running", "error_code": None},
        )
        zip_bytes = _build_zip_for_kind(
            kind=kind, members_id=members_id, access_token=access_token
        )
        path = _upload_artifact(
            access_token=access_token,
            members_id=members_id,
            export_id=export_id,
            zip_bytes=zip_bytes,
        )
        _update_job(
            access_token=access_token,
            members_id=members_id,
            export_id=export_id,
            fields={"status": "ready", "storage_path": path, "error_code": None},
        )
    except ValueError as exc:
        logger.info("書き出し業務エラー export_id=%s: %s", export_id, exc)
        _update_job(
            access_token=access_token,
            members_id=members_id,
            export_id=export_id,
            fields={"status": "failed", "error_code": "VALIDATION"},
        )
    except Exception:
        logger.exception("書き出し失敗 export_id=%s", export_id)
        try:
            _update_job(
                access_token=access_token,
                members_id=members_id,
                export_id=export_id,
                fields={"status": "failed", "error_code": "INTERNAL"},
            )
        except Exception:
            logger.exception("書き出し失敗状態の更新にも失敗 export_id=%s", export_id)


def create_export(
    *,
    members_id: str,
    access_token: str,
    kind: str,
    run_async: bool = False,
) -> dict[str, Any]:
    if kind not in ("text", "media"):
        raise ValueError("未対応の書き出し種別です")

    _fail_stale_media_jobs(access_token=access_token, members_id=members_id)

    if kind == "media":
        if _has_active_media(access_token=access_token, members_id=members_id):
            raise ExportBusyError("写真付き書き出しが進行中です")

    expires_at = _now() + timedelta(hours=_TTL_HOURS)
    client = create_user_client(access_token)
    insert = (
        client.table("data_export")
        .insert(
            {
                "members_id": members_id,
                "kind": kind,
                "status": "pending",
                "expires_at": expires_at.isoformat(),
            }
        )
        .execute()
    )
    if getattr(insert, "error", None):
        logger.error("data_export insert error: %s", insert.error)
        raise RuntimeError("書き出しジョブの作成に失敗しました")
    data = insert.data if hasattr(insert, "data") else None
    if not isinstance(data, list) or not data:
        raise RuntimeError("書き出しジョブの作成に失敗しました")
    row = data[0]
    export_id = str(row["data_export_id"])

    if kind == "text" or not run_async:
        # text は同期完了。media でも run_async=False なら同期（テスト用）
        run_export_job(
            members_id=members_id,
            access_token=access_token,
            export_id=export_id,
            kind=kind,
        )
        refreshed = _get_job_row(
            access_token=access_token, members_id=members_id, export_id=export_id
        )
        if not refreshed:
            raise RuntimeError("書き出しジョブの取得に失敗しました")
        return _job_to_api(refreshed)

    # media 非同期: pending のまま返し、呼び出し側が BackgroundTasks に積む
    return _job_to_api(row)


def get_export(
    *,
    members_id: str,
    access_token: str,
    export_id: str,
) -> dict[str, Any]:
    _fail_stale_media_jobs(access_token=access_token, members_id=members_id)
    row = _get_job_row(
        access_token=access_token, members_id=members_id, export_id=export_id
    )
    if not row:
        raise ExportNotFoundError("書き出しが見つかりません")
    expires = _parse_ts(row.get("expires_at"))
    if expires and expires < _now() and row.get("status") == "ready":
        raise ExportExpiredError("書き出しの期限が切れました")
    return _job_to_api(row)


def download_export_file(
    *,
    members_id: str,
    access_token: str,
    export_id: str,
) -> tuple[bytes, str]:
    row = _get_job_row(
        access_token=access_token, members_id=members_id, export_id=export_id
    )
    if not row:
        raise ExportNotFoundError("書き出しが見つかりません")
    expires = _parse_ts(row.get("expires_at"))
    if expires and expires < _now():
        raise ExportExpiredError("書き出しの期限が切れました")
    if row.get("status") != "ready":
        raise ExportNotReadyError("まだ準備中です")
    storage_path = row.get("storage_path")
    if not storage_path:
        raise ExportNotReadyError("まだ準備中です")

    client = create_user_client(access_token)
    try:
        data = client.storage.from_(_ARTIFACT_BUCKET).download(str(storage_path))
    except Exception:
        logger.exception("書き出しダウンロード失敗 export_id=%s", export_id)
        raise RuntimeError("書き出しファイルの取得に失敗しました") from None
    if not isinstance(data, (bytes, bytearray)):
        raise RuntimeError("書き出しファイルの取得に失敗しました")

    kind = row.get("kind") or "text"
    filename = f"oshi-export-{kind}-{export_id[:8]}.zip"
    return bytes(data), filename
