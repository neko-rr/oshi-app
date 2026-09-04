# TDD: GET/PUT /display-settings は認証必須。text_scale / ui_density は 1〜7。
# list_sort / gallery_layout / landing_page / residence_* は allowlist。
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

FULL_PREFS = {
    "text_scale": 5,
    "ui_density": 2,
    "list_sort": "name",
    "gallery_layout": "large",
    "landing_page": "gallery",
    "residence_region": "us_pacific",
    "timezone_override": "America/Los_Angeles",
    "date_format_mode": "ui_locale",
    "currency_code_override": "USD",
    "currency_format_mode": "ui_locale",
    "register_start_step": "photo",
    "default_storage_location_id": 12,
    "gallery_show_name": False,
    "gallery_show_tags": True,
    "gallery_show_price": False,
}

BASE_BODY = {
    "text_scale": 3,
    "ui_density": 4,
    "list_sort": "newest",
    "gallery_layout": "grid",
    "landing_page": "home",
    "residence_region": "jp",
    "timezone_override": None,
    "date_format_mode": "residence",
    "currency_code_override": None,
    "currency_format_mode": "residence",
    "register_start_step": "barcode",
    "default_storage_location_id": None,
    "gallery_show_name": True,
    "gallery_show_tags": True,
    "gallery_show_price": True,
}


def test_display_settings_requires_auth() -> None:
    assert client.get("/display-settings").status_code == 401
    assert client.put("/display-settings", json=BASE_BODY).status_code == 401


def test_get_display_settings_returns_prefs() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.display_settings.display_settings_service.get_display_settings",
            return_value=FULL_PREFS,
        ) as mocked,
    ):
        res = client.get("/display-settings", headers=AUTH)
    assert res.status_code == 200
    assert res.json() == FULL_PREFS
    assert mocked.call_args.kwargs["members_id"] == USER.members_id


def test_put_display_settings_saves_prefs() -> None:
    saved = {
        "text_scale": 7,
        "ui_density": 1,
        "list_sort": "created_at",
        "gallery_layout": "list",
        "landing_page": "register",
        "residence_region": "uk",
        "timezone_override": "Europe/London",
        "date_format_mode": "iso",
        "currency_code_override": "GBP",
        "currency_format_mode": "plain",
        "register_start_step": "confirm",
        "default_storage_location_id": 3,
        "gallery_show_name": False,
        "gallery_show_tags": False,
        "gallery_show_price": True,
    }
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.display_settings.display_settings_service.save_display_settings",
            return_value=saved,
        ) as mocked,
    ):
        res = client.put(
            "/display-settings",
            headers=AUTH,
            json=saved,
        )
    assert res.status_code == 200
    assert res.json() == saved
    assert mocked.call_args.kwargs["list_sort"] == "created_at"
    assert mocked.call_args.kwargs["gallery_layout"] == "list"
    assert mocked.call_args.kwargs["landing_page"] == "register"
    assert mocked.call_args.kwargs["residence_region"] == "uk"
    assert mocked.call_args.kwargs["timezone_override"] == "Europe/London"
    assert mocked.call_args.kwargs["date_format_mode"] == "iso"
    assert mocked.call_args.kwargs["currency_code_override"] == "GBP"
    assert mocked.call_args.kwargs["currency_format_mode"] == "plain"
    assert mocked.call_args.kwargs["register_start_step"] == "confirm"
    assert mocked.call_args.kwargs["default_storage_location_id"] == 3
    assert mocked.call_args.kwargs["gallery_show_name"] is False
    assert mocked.call_args.kwargs["gallery_show_tags"] is False
    assert mocked.call_args.kwargs["gallery_show_price"] is True
    assert mocked.call_args.kwargs["members_id"] == USER.members_id


def test_put_display_settings_rejects_out_of_range() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.display_settings.display_settings_service.save_display_settings",
            side_effect=ValueError("未対応の表示設定です"),
        ),
    ):
        res = client.put(
            "/display-settings",
            headers=AUTH,
            json={**BASE_BODY, "text_scale": 99},
        )
    assert res.status_code == 400
    body = res.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_put_display_settings_rejects_unknown_list_sort() -> None:
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.display_settings.display_settings_service.save_display_settings",
            side_effect=ValueError("未対応の表示設定です（list_sort）"),
        ),
    ):
        res = client.put(
            "/display-settings",
            headers=AUTH,
            json={**BASE_BODY, "list_sort": "popular"},
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_put_display_settings_rejects_unknown_residence_region() -> None:
    with patch("app.deps.auth.verify_access_token", return_value=USER):
        res = client.put(
            "/display-settings",
            headers=AUTH,
            json={**BASE_BODY, "residence_region": "mars"},
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_put_display_settings_rejects_unknown_date_format_mode() -> None:
    with patch("app.deps.auth.verify_access_token", return_value=USER):
        res = client.put(
            "/display-settings",
            headers=AUTH,
            json={**BASE_BODY, "date_format_mode": "fancy"},
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_normalize_residence_defaults() -> None:
    from app.services import display_settings_service as svc

    assert svc._row_or_defaults(None) == {
        "text_scale": 3,
        "ui_density": 4,
        "list_sort": "newest",
        "gallery_layout": "grid",
        "landing_page": "home",
        "residence_region": "jp",
        "timezone_override": None,
        "date_format_mode": "residence",
        "currency_code_override": None,
        "currency_format_mode": "residence",
        "register_start_step": "barcode",
        "default_storage_location_id": None,
        "gallery_show_name": True,
        "gallery_show_tags": True,
        "gallery_show_price": True,
    }


def test_normalize_gallery_show_bool() -> None:
    from app.services import display_settings_service as svc
    import pytest

    assert svc._normalize_bool(True, field="gallery_show_name") is True
    assert svc._normalize_bool(False, field="gallery_show_tags") is False
    with pytest.raises(ValueError, match="gallery_show_price"):
        svc._normalize_bool("yes", field="gallery_show_price")
    with pytest.raises(ValueError, match="gallery_show_name"):
        svc._normalize_bool(1, field="gallery_show_name")


def test_put_display_settings_rejects_non_bool_gallery_show() -> None:
    with patch("app.deps.auth.verify_access_token", return_value=USER):
        res = client.put(
            "/display-settings",
            headers=AUTH,
            json={**BASE_BODY, "gallery_show_name": "yes"},
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_normalize_register_start_step_allowlist() -> None:
    from app.services import display_settings_service as svc
    import pytest

    assert svc._normalize_choice(
        "photo",
        field="register_start_step",
        allowed=svc.ALLOWED_REGISTER_START_STEP,
    ) == "photo"
    with pytest.raises(ValueError, match="register_start_step"):
        svc._normalize_choice(
            "assist",
            field="register_start_step",
            allowed=svc.ALLOWED_REGISTER_START_STEP,
        )


def test_normalize_default_storage_location_id() -> None:
    from app.services import display_settings_service as svc
    import pytest

    assert svc._normalize_default_storage_location_id(None) is None
    assert svc._normalize_default_storage_location_id("") is None
    assert svc._normalize_default_storage_location_id(7) == 7
    with pytest.raises(ValueError, match="default_storage_location_id"):
        svc._normalize_default_storage_location_id(0)
    with pytest.raises(ValueError, match="default_storage_location_id"):
        svc._normalize_default_storage_location_id(-1)


def test_put_display_settings_rejects_unknown_register_start_step() -> None:
    with patch("app.deps.auth.verify_access_token", return_value=USER):
        res = client.put(
            "/display-settings",
            headers=AUTH,
            json={**BASE_BODY, "register_start_step": "assist"},
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_normalize_timezone_override_empty_becomes_none() -> None:
    from app.services import display_settings_service as svc

    assert svc._normalize_timezone_override("") is None
    assert svc._normalize_timezone_override(None) is None
    assert svc._normalize_timezone_override("Asia/Tokyo") == "Asia/Tokyo"


def test_normalize_timezone_override_accepts_iana_world_zones() -> None:
    from app.services import display_settings_service as svc

    assert svc._normalize_timezone_override("Europe/Paris") == "Europe/Paris"
    assert svc._normalize_timezone_override("America/Chicago") == "America/Chicago"
    assert svc._normalize_timezone_override("Pacific/Auckland") == "Pacific/Auckland"


def test_normalize_timezone_override_rejects_unknown_iana() -> None:
    from app.services import display_settings_service as svc
    import pytest

    with pytest.raises(ValueError, match="timezone_override"):
        svc._normalize_timezone_override("Fake/NotAZone")


def test_put_display_settings_accepts_expanded_region_and_iana_tz() -> None:
    saved = {
        **BASE_BODY,
        "residence_region": "de",
        "timezone_override": "Europe/Berlin",
        "date_format_mode": "residence",
    }
    with (
        patch("app.deps.auth.verify_access_token", return_value=USER),
        patch(
            "app.routers.display_settings.display_settings_service.save_display_settings",
            return_value=saved,
        ) as mocked,
    ):
        res = client.put("/display-settings", headers=AUTH, json=saved)
    assert res.status_code == 200
    assert mocked.call_args.kwargs["residence_region"] == "de"
    assert mocked.call_args.kwargs["timezone_override"] == "Europe/Berlin"


def test_normalize_residence_region_accepts_expanded_catalog() -> None:
    from app.services import display_settings_service as svc

    assert "de" in svc.ALLOWED_RESIDENCE_REGION
    assert "au" in svc.ALLOWED_RESIDENCE_REGION
    assert svc._normalize_choice(
        "sg", field="residence_region", allowed=svc.ALLOWED_RESIDENCE_REGION
    ) == "sg"


def test_normalize_currency_code_override_accepts_iso4217() -> None:
    from app.services import display_settings_service as svc

    assert svc._normalize_currency_code_override(None) is None
    assert svc._normalize_currency_code_override("") is None
    assert svc._normalize_currency_code_override("jpy") == "JPY"
    assert svc._normalize_currency_code_override("EUR") == "EUR"


def test_normalize_currency_code_override_rejects_unknown() -> None:
    from app.services import display_settings_service as svc
    import pytest

    with pytest.raises(ValueError, match="currency_code_override"):
        svc._normalize_currency_code_override("XXX")


def test_put_display_settings_rejects_unknown_currency_format_mode() -> None:
    with patch("app.deps.auth.verify_access_token", return_value=USER):
        res = client.put(
            "/display-settings",
            headers=AUTH,
            json={**BASE_BODY, "currency_format_mode": "fancy"},
        )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"
