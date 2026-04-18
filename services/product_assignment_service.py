"""登録製品へのカテゴリ・収納場所 FK の付与（更新）。"""

import logging
from typing import Any, Dict, Optional, Tuple

import httpx
from postgrest.exceptions import APIError
from supabase import Client

from services.debug_log import dash_debug_print
from services.supabase_client import PUBLISHABLE_KEY, SUPABASE_URL

logger = logging.getLogger(__name__)


def _rest_v1_root() -> str:
    """PostgREST の /rest/v1 基底（SUPABASE_URL は supabase_client でプロジェクトルートに正規化済み）。"""
    base = (SUPABASE_URL or "").rstrip("/")
    return f"{base}/rest/v1"

try:
    from flask import g, has_app_context
except Exception:  # pragma: no cover
    g = None

    def has_app_context() -> bool:  # type: ignore[misc]
        return False


def _current_members_id() -> Optional[str]:
    if g is None or not has_app_context():
        return None
    uid = getattr(g, "user_id", None)
    return str(uid) if uid else None


def _current_access_token() -> Optional[str]:
    if g is None or not has_app_context():
        return None
    t = getattr(g, "access_token", None)
    return str(t) if t else None


def _unwrap_dash_value(v: Any) -> Any:
    """Dash の Dropdown 等が dict で返す場合に value を取り出す。"""
    if isinstance(v, dict) and "value" in v:
        return v.get("value")
    return v


def _as_positive_int(v: Any) -> Optional[int]:
    if v is None or v == "":
        return None
    v = _unwrap_dash_value(v)
    if v is None or v == "":
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, float):
        if v != v:
            return None
        iv = int(v)
        if iv != v:
            return None
        v = iv
    try:
        i = int(v)
    except (TypeError, ValueError):
        return None
    if i <= 0:
        return None
    return i


def _patch_registration_product_fks_http(
    members_id: str,
    pid: int,
    payload: Dict[str, Any],
) -> Tuple[bool, str]:
    """
    postgrest-py の PATCH 応答が {} 単体のとき APIResponse の pydantic 検証で落ちるため、
    REST を直接叩いて成功のみ判定する。
    """
    token = _current_access_token()
    if not token:
        return False, "ログインが必要です。"
    if not SUPABASE_URL or not PUBLISHABLE_KEY:
        return False, "接続に失敗しました。"

    url = f"{_rest_v1_root()}/registration_product_information"
    params = {
        "registration_product_id": f"eq.{pid}",
        "members_id": f"eq.{members_id}",
    }
    headers = {
        "apikey": PUBLISHABLE_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.patch(url, params=params, headers=headers, json=payload)
    except httpx.HTTPError as e:
        dash_debug_print(f"product_assignment httpx: {type(e).__name__}"[:200])
        return False, "保存に失敗しました。しばらくしてから再度お試しください。"

    if r.status_code in (200, 204):
        return True, ""

    body_trunc = (r.text or "")[:300]
    logger.warning(
        "product_assignment PATCH failed: status=%s body_trunc=%s",
        r.status_code,
        body_trunc,
    )
    dash_debug_print(
        f"product_assignment PATCH status={r.status_code} body={body_trunc}"
    )
    if r.status_code == 401:
        return False, "ログインの有効期限が切れている可能性があります。再度ログインしてください。"
    if r.status_code == 403:
        return False, "保存できませんでした（権限を確認してください）。"
    if r.status_code == 404:
        return False, "接続先の設定が正しくない可能性があります。管理者に連絡してください。"
    return False, "保存に失敗しました。しばらくしてから再度お試しください。"


def set_product_category_and_receipt(
    supabase: Client,
    members_id: Optional[str],
    registration_product_id: Any,
    *,
    category_tag_id: Optional[Any],
    receipt_location_id: Optional[Any],
) -> Tuple[bool, str]:
    """
    製品行の category_tag_id / receipt_location_id を更新する。
    None は NULL 解除。参照先は同一 members_id の行のみ許可。
    """
    if supabase is None:
        return False, "接続に失敗しました。"

    if not members_id:
        members_id = _current_members_id()
    if not members_id:
        return False, "ログインが必要です。"

    pid = _as_positive_int(registration_product_id)
    if not pid:
        return False, "製品を特定できませんでした。"

    cid = category_tag_id
    if cid is not None and cid != "":
        cid = _as_positive_int(cid)
    else:
        cid = None

    rid = receipt_location_id
    if rid is not None and rid != "":
        rid = _as_positive_int(rid)
    else:
        rid = None

    try:
        prod = (
            supabase.table("registration_product_information")
            .select("registration_product_id")
            .eq("registration_product_id", pid)
            .eq("members_id", members_id)
            .limit(1)
            .execute()
        )
        rows = prod.data if hasattr(prod, "data") else []
        if not rows:
            return False, "対象のデータが見つかりませんでした。"

        if cid is not None:
            ct = (
                supabase.table("category_tag")
                .select("category_tag_id")
                .eq("category_tag_id", cid)
                .eq("members_id", members_id)
                .limit(1)
                .execute()
            )
            if not (ct.data if hasattr(ct, "data") else []):
                return False, "カテゴリータグを選択できませんでした。"

        if rid is not None:
            rl = (
                supabase.table("receipt_location")
                .select("receipt_location_id")
                .eq("receipt_location_id", rid)
                .eq("members_id", members_id)
                .limit(1)
                .execute()
            )
            if not (rl.data if hasattr(rl, "data") else []):
                return False, "収納場所タグを選択できませんでした。"

        payload: Dict[str, Any] = {
            "category_tag_id": cid,
            "receipt_location_id": rid,
        }
        return _patch_registration_product_fks_http(members_id, pid, payload)
    except APIError as e:
        dash_debug_print(f"product_assignment APIError: {e!s}"[:500])
        return False, "保存に失敗しました。しばらくしてから再度お試しください。"
    except Exception as e:
        dash_debug_print(f"product_assignment unexpected: {type(e).__name__}: {e!s}"[:500])
        return False, "保存に失敗しました。しばらくしてから再度お試しください。"
