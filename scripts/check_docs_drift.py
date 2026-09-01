#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成ドキュメントのドリフト検査（CI 用）。

product / design / db(snapshot) を再生成し、時刻行以外の差分があれば失敗する。
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# 時刻・メタだけ変わる行は無視
IGNORE_LINE_RE = re.compile(
    r"(生成時刻|生成日時|generated_at|更新: 自動フォルダ)",
)

WATCH_DIRS = (
    ROOT / "docs" / "product" / "generated",
    ROOT / "docs" / "design" / "generated",
    ROOT / "docs" / "db" / "generated",
    ROOT / "docs" / "legal" / "generated",
    ROOT / "apps" / "web" / "src" / "data" / "generated",
)

# FastAPI / Pydantic のマイナー差で揺れるため、構造チェック（inventory 等）に任せる
SKIP_REL_PATHS = {
    "docs/product/generated/openapi.asbuilt.json",
    "docs/product/generated/api_openapi.md",
}


def normalize(text: str) -> str:
    lines = [ln for ln in text.splitlines() if not IGNORE_LINE_RE.search(ln)]
    # 末尾改行の有無差を吸収
    return "\n".join(lines).rstrip() + "\n"


def snapshot_dir(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_dir():
        return out
    for f in sorted(path.rglob("*")):
        if not f.is_file():
            continue
        rel = str(f.relative_to(ROOT)).replace("\\", "/")
        if rel in SKIP_REL_PATHS:
            continue
        try:
            text = f.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        out[rel] = normalize(text)
    return out


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=ROOT, check=True)


def main() -> int:
    before: dict[str, str] = {}
    for d in WATCH_DIRS:
        before.update(snapshot_dir(d))

    run([sys.executable, str(ROOT / "scripts" / "generate_product_docs.py")])
    run([sys.executable, str(ROOT / "scripts" / "generate_design_docs.py")])
    run(
        [
            sys.executable,
            str(ROOT / "scripts" / "generate_db_docs.py"),
            "--snapshot",
            "docs/db/generated/schema_snapshot.json",
        ]
    )
    run([sys.executable, str(ROOT / "scripts" / "generate_third_party_notices.py")])

    after: dict[str, str] = {}
    for d in WATCH_DIRS:
        after.update(snapshot_dir(d))

    added = sorted(set(after) - set(before))
    removed = sorted(set(before) - set(after))
    changed = sorted(k for k in before.keys() & after.keys() if before[k] != after[k])

    if not added and not removed and not changed:
        print("docs drift: OK（時刻行以外の差分なし）")
        return 0

    print("=== docs drift: 生成物がコードと不一致 ===", file=sys.stderr)
    for p in removed:
        print(f"  - missing after regen: {p}", file=sys.stderr)
    for p in added:
        print(f"  - unexpected new: {p}", file=sys.stderr)
    for p in changed:
        print(f"  - content drifted: {p}", file=sys.stderr)
    print(
        "再生成してコミット: python scripts/generate_product_docs.py && "
        "python scripts/generate_design_docs.py && "
        "python scripts/generate_db_docs.py --snapshot docs/db/generated/schema_snapshot.json && "
        "python scripts/generate_third_party_notices.py",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
