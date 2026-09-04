# TDD: POST/GET /exports・ファイル取得。media 同時実行は 409。
from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.deps.auth import AuthenticatedUser
from app.main import app

client = TestClient(app)

USER = AuthenticatedUser(
    members_id="22222222-2222-2222-2222-222222222222",
    email="a@example.com",
)
AUTH = {"Authorization": "Bearer fake-jwt"}
EXPORT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

READY_JOB = {
    "export_id": EXPORT_ID,
    "kind": "text",
    "status": "ready",
    "error_code": None,
    "created_at": "2026-09-04T00:00:00+00:00",
    "expires_at": "2026-09-05T00:00:00+00:00",
}


def test_exports_requires_auth() -> None:
    assert client.post("/exports", json={"kind": "text"}).status_code == 401
    assert client.get(f"/exports/{EXPORT_ID}").status_code == 401
    assert client.get(f"/exports/{EXPORT_ID}/file").status_code == 401


def test_create_text_export_returns_ready_job() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.exports.export_service.create_export",
            return_value=READY_JOB,
        ) as mocked,
    ):
        res = client.post("/exports", json={"kind": "text"}, headers=AUTH)
    assert res.status_code == 200
    assert res.json()["status"] == "ready"
    assert res.json()["kind"] == "text"
    assert mocked.call_args.kwargs["kind"] == "text"
    assert mocked.call_args.kwargs["members_id"] == USER.members_id


def test_create_media_export_conflict_when_busy() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.exports.export_service.create_export",
            side_effect=export_service_conflict(),
        ),
    ):
        res = client.post("/exports", json={"kind": "media"}, headers=AUTH)
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "EXPORT_BUSY"


def test_get_export_status() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.exports.export_service.get_export",
            return_value=READY_JOB,
        ) as mocked,
    ):
        res = client.get(f"/exports/{EXPORT_ID}", headers=AUTH)
    assert res.status_code == 200
    assert res.json()["export_id"] == EXPORT_ID
    assert mocked.call_args.kwargs["export_id"] == EXPORT_ID


def test_download_export_file() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.exports.export_service.download_export_file",
            return_value=(b"PK\x03\x04fake", "oshi-export-text.zip"),
        ) as mocked,
    ):
        res = client.get(f"/exports/{EXPORT_ID}/file", headers=AUTH)
    assert res.status_code == 200
    assert res.headers["content-disposition"].startswith("attachment;")
    assert res.content.startswith(b"PK")
    assert mocked.call_args.kwargs["export_id"] == EXPORT_ID


def export_service_conflict() -> Exception:
    from app.services.export_service import ExportBusyError

    return ExportBusyError("写真付き書き出しが進行中です")
