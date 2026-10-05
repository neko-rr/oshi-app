# TDD: Render はリポジトリルートを Docker の文脈にする。
from __future__ import annotations

from pathlib import Path

API_DIR = Path(__file__).resolve().parents[1]
DOCKERFILE = API_DIR / "Dockerfile"
REQ_PROD = API_DIR / "requirements-prod.txt"
REQ_DEV = API_DIR / "requirements.txt"


def test_dockerfile_copies_from_monorepo_paths() -> None:
    text = DOCKERFILE.read_text(encoding="utf-8")
    assert "COPY apps/api/" in text
    assert "COPY apps/api/app" in text
    assert "COPY requirements.txt" not in text.replace("apps/api/requirements", "")
    assert "tests/" not in text
    assert "uvicorn" in text
    assert "app.main:app" in text
    assert "PORT" in text
    assert "--host 0.0.0.0" in text
    assert "SUPABASE" not in text
    assert "ARG" not in text or "SECRET" not in text.upper()


def test_prod_requirements_exclude_pytest_and_dev_includes_prod() -> None:
    prod = REQ_PROD.read_text(encoding="utf-8")
    dev = REQ_DEV.read_text(encoding="utf-8")
    prod_pkgs = "\n".join(
        line for line in prod.splitlines() if line.strip() and not line.lstrip().startswith("#")
    )
    assert "fastapi" in prod_pkgs
    assert "uvicorn" in prod_pkgs
    assert "pytest" not in prod_pkgs
    assert "-r requirements-prod.txt" in dev
    assert "pytest" in dev
