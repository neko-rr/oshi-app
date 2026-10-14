"""未処理例外の通知。URL が無いときは送らない。秘密は載せない。"""

from __future__ import annotations

from app.services.error_notify import build_error_notice, notify_unhandled_error


def test_empty_webhook_does_not_post() -> None:
    called: list[object] = []

    sent = notify_unhandled_error(
        webhook_url="",
        notice={"path": "/products"},
        post=lambda url, body: called.append((url, body)),
    )

    assert sent is False
    assert called == []


def test_http_webhook_is_rejected() -> None:
    called: list[object] = []

    sent = notify_unhandled_error(
        webhook_url="http://example.test/hook",
        notice={"path": "/products"},
        post=lambda url, body: called.append((url, body)),
    )

    assert sent is False
    assert called == []


def test_notice_drops_query_and_bearer() -> None:
    notice = build_error_notice(
        method="GET",
        path="/products?token=secret-value",
        exc=RuntimeError("failed bearer abc.def.ghi"),
    )

    assert notice["path"] == "/products"
    assert "secret-value" not in str(notice)
    assert "abc.def.ghi" not in notice["message"]
    assert "bearer [redacted]" in notice["message"]


def test_https_webhook_posts_notice() -> None:
    called: list[tuple[str, dict]] = []

    sent = notify_unhandled_error(
        webhook_url="https://example.test/hook",
        notice={"path": "/products", "error_type": "RuntimeError"},
        post=lambda url, body: called.append((url, body)),
    )

    assert sent is True
    assert called == [
        ("https://example.test/hook", {"path": "/products", "error_type": "RuntimeError"})
    ]
