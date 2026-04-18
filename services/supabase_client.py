import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client

try:  # Flask が無い場合もあるため安全に import
    from flask import g, has_app_context
except Exception:  # pragma: no cover
    g = None
    has_app_context = lambda: False  # type: ignore

# supabase-py v2 の ClientOptions（options に dict を渡すと壊れるため型を揃える）
try:
    from supabase.lib.client_options import ClientOptions
except Exception:  # pragma: no cover
    ClientOptions = None  # type: ignore

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOTENV_PATH = os.path.join(PROJECT_ROOT, ".env")
load_dotenv(dotenv_path=DOTENV_PATH, override=False)

def _normalize_supabase_project_url(raw: str) -> str:
    """
    PUBLIC_SUPABASE_URL が誤って /rest/v1 まで含む場合にプロジェクトルートへ寄せる。
    create_client と手動 REST 呼び出しで同じ基底になるようにする。
    """
    u = (raw or "").strip().rstrip("/")
    suffix = "/rest/v1"
    if len(u) >= len(suffix) and u.lower().endswith(suffix.lower()):
        return u[: -len(suffix)].rstrip("/")
    return u


SUPABASE_URL = _normalize_supabase_project_url(os.getenv("PUBLIC_SUPABASE_URL") or "")
# publishable key は PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY のみを使用（フォールバック無し）
PUBLISHABLE_KEY = os.getenv("PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY") or ""
SECRET_KEY = os.getenv("SUPABASE_SECRET_DEFAULT_KEY")


def _create_client(api_key: str, access_token: Optional[str] = None) -> Optional[Client]:
    if not SUPABASE_URL or not api_key:
        return None
    headers = None
    if access_token:
        headers = {"Authorization": f"Bearer {access_token}"}

    # supabase-py v2: options は ClientOptions を渡す（dict は不可）
    if headers and ClientOptions is not None:
        return create_client(SUPABASE_URL, api_key, options=ClientOptions(headers=headers))

    # フォールバック: headers が無い場合、または ClientOptions が import できない場合
    return create_client(SUPABASE_URL, api_key)


@lru_cache(maxsize=1)
def get_publishable_client() -> Optional[Client]:
    """公開してよい publishable key で生成（RLS前提）。"""
    return _create_client(PUBLISHABLE_KEY or "")


def get_secret_client() -> Optional[Client]:
    """管理操作が必要なときだけ使用（漏洩注意）。"""
    return _create_client(SECRET_KEY or "")


def get_user_client(access_token: Optional[str]) -> Optional[Client]:
    """ユーザーのアクセストークンをヘッダに付与したクライアントを返す。"""
    if not access_token:
        return None
    return _create_client(PUBLISHABLE_KEY or "", access_token=access_token)


def get_supabase_client() -> Optional[Client]:
    """
    既存互換API。
    - Flaskコンテキストに access_token があればユーザークライアント
    - なければ publishable クライアント
    """
    token = None
    if has_app_context() and g is not None and hasattr(g, "access_token"):
        token = getattr(g, "access_token", None)
    user_client = get_user_client(token)
    if user_client:
        return user_client
    return get_publishable_client()
