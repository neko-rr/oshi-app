# TDD: SUPABASE_JWKS_URL があればそれを優先し、無ければ URL から組み立てる
from __future__ import annotations

from app.core.settings import Settings


def test_jwks_url_prefers_explicit_env() -> None:
    s = Settings(
        _env_file=None,
        supabase_url="https://example.supabase.co",
        supabase_jwks_url="https://example.supabase.co/custom/jwks.json",
    )
    assert s.resolved_jwks_url == "https://example.supabase.co/custom/jwks.json"


def test_jwks_url_falls_back_to_supabase_url() -> None:
    s = Settings(
        _env_file=None,
        supabase_url="https://example.supabase.co",
        supabase_jwks_url="",
    )
    assert (
        s.resolved_jwks_url
        == "https://example.supabase.co/auth/v1/.well-known/jwks.json"
    )


def test_jwks_url_empty_when_no_url() -> None:
    s = Settings(_env_file=None, supabase_url="", supabase_jwks_url="")
    assert s.resolved_jwks_url == ""
