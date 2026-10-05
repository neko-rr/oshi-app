# TDD: Cloudflare Workers（OpenNext）の最小契約。
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WRANGLER = ROOT / "apps" / "web" / "wrangler.jsonc"


def _load_jsonc(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    lines = []
    for line in raw.splitlines():
        stripped = line.strip()
        if stripped.startswith("//"):
            continue
        if "//" in line:
            line = line[: line.index("//")]
        lines.append(line)
    return json.loads("\n".join(lines))


def test_wrangler_is_opennext_worker_for_oshihaven() -> None:
    """CF 接続名は oshi-app。製品名 Oshihaven とは別。"""
    data = _load_jsonc(WRANGLER)
    assert data["name"] == "oshi-app"
    assert data["main"] == ".open-next/worker.js"
    assert "nodejs_compat" in data["compatibility_flags"]
    assert "global_fetch_strictly_public" in data["compatibility_flags"]
    assert data["assets"]["directory"] == ".open-next/assets"
    self_ref = next(
        s for s in data["services"] if s["binding"] == "WORKER_SELF_REFERENCE"
    )
    assert self_ref["service"] == "oshi-app"
    # workers.dev を切ると Version URL も死に、プレビューが空ページになる
    assert data.get("workers_dev") is True
    assert data.get("preview_urls") is True
    vars_ = data.get("vars") or {}
    assert "SUPABASE_SECRET_KEY" not in vars_
    assert "SUPABASE_JWT_SECRET" not in vars_
