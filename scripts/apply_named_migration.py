"""指定の supabase/migrations SQL を DATABASE_URL で実行する。接続文字列は出さない。"""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load_db_url() -> str | None:
    for env_path in (ROOT / "apps" / "api" / ".env", ROOT / ".env"):
        if not env_path.is_file():
            continue
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k in ("DATABASE_URL", "SUPABASE_DB_URL") and k not in os.environ and v:
                os.environ[k] = v
    return os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")


def _safe_exc(exc: BaseException) -> str:
    """接続文字列・ホストを出さない。"""
    raw = str(exc)
    lowered = raw.lower()
    if any(
        n in lowered
        for n in ("postgres://", "postgresql://", "password", "user=", "db.")
    ):
        # ホスト名や認証を含む行は型だけ残す
        if "getaddrinfo" in lowered or "failed to resolve" in lowered:
            return "DNS_RESOLVE_FAILED"
        if "multiple commands" in lowered:
            return "MULTIPLE_COMMANDS"
        return "REDACTED"
    return raw[:240]


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python scripts/apply_named_migration.py <migration.sql>")
        return 2
    name = Path(sys.argv[1]).name
    sql_path = ROOT / "supabase" / "migrations" / name
    if not sql_path.is_file():
        print("MIGRATION_MISSING")
        return 1
    url = _load_db_url()
    if not url:
        print("NO_DB_URL")
        return 2
    try:
        import psycopg
    except ImportError:
        print("NO_PSYCOPG")
        return 1
    sql = sql_path.read_text(encoding="utf-8")
    statements = [part.strip() for part in sql.split(";") if part.strip() and not part.strip().startswith("--")]
    try:
        with psycopg.connect(url) as conn:
            for stmt in statements:
                conn.execute(stmt)
            conn.commit()
    except Exception as exc:
        print("MIGRATION_FAIL", type(exc).__name__, _safe_exc(exc))
        return 1
    print("MIGRATION_OK", name)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
