"""product_assignment_service のユニットテスト（軽量モック）。"""

from unittest.mock import MagicMock, patch

from services.product_assignment_service import set_product_category_and_receipt
from services.supabase_client import _normalize_supabase_project_url


def test_normalize_supabase_url_strips_rest_v1_suffix():
    assert (
        _normalize_supabase_project_url("https://abc.supabase.co/rest/v1")
        == "https://abc.supabase.co"
    )
    assert (
        _normalize_supabase_project_url("https://abc.supabase.co/rest/v1/")
        == "https://abc.supabase.co"
    )
    assert (
        _normalize_supabase_project_url("https://abc.supabase.co")
        == "https://abc.supabase.co"
    )


def test_returns_false_when_supabase_none():
    ok, msg = set_product_category_and_receipt(
        None, "m1", 1, category_tag_id=None, receipt_location_id=None
    )
    assert ok is False
    assert "接続" in msg


@patch(
    "services.product_assignment_service._current_members_id",
    return_value=None,
)
def test_returns_false_when_members_missing(_mock_mid):
    sb = MagicMock()
    ok, msg = set_product_category_and_receipt(
        sb, None, 1, category_tag_id=None, receipt_location_id=None
    )
    assert ok is False
    assert "ログイン" in msg


def test_returns_false_for_invalid_product_id():
    sb = MagicMock()
    ok, msg = set_product_category_and_receipt(
        sb, "m1", 0, category_tag_id=None, receipt_location_id=None
    )
    assert ok is False


def _mock_select_chains():
    """SELECT 用の自己連鎖モックを組み立てる。"""

    def self_chain_execute(data):
        m = MagicMock()
        m.select.return_value = m
        m.eq.return_value = m
        m.limit.return_value = m
        m.execute.return_value = MagicMock(data=data)
        return m

    prod_chain = self_chain_execute([{"registration_product_id": 5}])
    prod_tbl = MagicMock()
    prod_tbl.select.return_value = prod_chain

    cat_chain = self_chain_execute([{"category_tag_id": 9}])
    cat_tbl = MagicMock()
    cat_tbl.select.return_value = cat_chain

    rec_chain = self_chain_execute([{"receipt_location_id": 7}])
    rec_tbl = MagicMock()
    rec_tbl.select.return_value = rec_chain

    def table(name):
        if name == "registration_product_information":
            return prod_tbl
        if name == "category_tag":
            return cat_tbl
        if name == "receipt_location":
            return rec_tbl
        return MagicMock()

    return table


@patch(
    "services.product_assignment_service._patch_registration_product_fks_http",
    return_value=(True, ""),
)
def test_success_when_selects_pass_and_http_ok(_mock_http):
    sb = MagicMock()
    sb.table.side_effect = _mock_select_chains()

    ok, msg = set_product_category_and_receipt(
        sb, "m1", 5, category_tag_id=9, receipt_location_id=7
    )
    assert ok is True
    assert msg == ""
    _mock_http.assert_called_once()
    call_kw = _mock_http.call_args[0]
    assert call_kw[0] == "m1"
    assert call_kw[1] == 5
    assert call_kw[2] == {"category_tag_id": 9, "receipt_location_id": 7}


@patch(
    "services.product_assignment_service._patch_registration_product_fks_http",
    return_value=(True, ""),
)
def test_unwraps_dropdown_dict_value(_mock_http):
    sb = MagicMock()
    sb.table.side_effect = _mock_select_chains()

    ok, msg = set_product_category_and_receipt(
        sb,
        "m1",
        5,
        category_tag_id={"value": 9, "label": "x"},
        receipt_location_id={"value": 7},
    )
    assert ok is True
    assert _mock_http.call_args[0][2] == {"category_tag_id": 9, "receipt_location_id": 7}
