from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """API 環境変数。秘密はログに出さない。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    supabase_url: str = ""
    # 公式 Library 寄せ（任意。現状 JWT 検証には未使用でも保持可）
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""
    # 明示 JWKS。未設定時は supabase_url から組み立て
    supabase_jwks_url: str = ""
    # Legacy JWT Secret は検証に使わない（JWKS のみ）。残っていても無視される
    supabase_jwt_secret: str = ""
    cors_origins: str = "http://127.0.0.1:3000,http://localhost:3000"

    # --- 外部アシスト（既定は実 HTTP オフ） ---
    io_intelligence_api_key: str = ""
    io_intelligence_api_url: str = (
        "https://api.intelligence.io.solutions/api/v1/chat/completions"
    )
    io_intelligence_model: str = "meta-llama/Llama-3.2-90B-Vision-Instruct"
    io_tag_model: str = "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"
    io_intelligence_fallback_model: str = "meta-llama/Llama-3.2-90B-Vision-Instruct"
    # 1/true のときだけ実呼び出し経路へ進む（現時点 HTTP 本体は未完了）
    io_live_calls: bool = False

    rakuten_application_id: str = ""
    rakuten_affiliate_id: str = ""
    rakuten_live_calls: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def resolved_jwks_url(self) -> str:
        """SUPABASE_JWKS_URL 優先。無ければ SUPABASE_URL から標準パスを組み立て。"""
        explicit = self.supabase_jwks_url.strip()
        if explicit:
            return explicit
        base = self.supabase_url.strip().rstrip("/")
        if not base:
            return ""
        return f"{base}/auth/v1/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
