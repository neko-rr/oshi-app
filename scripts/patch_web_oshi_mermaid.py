# -*- coding: utf-8 -*-
"""Add bierner.markdown-mermaid to the live Web-Oshi Cursor profile."""
from __future__ import annotations

import json
import os
from pathlib import Path

EXT_ROOT = Path(os.path.expanduser(r"~\.cursor\extensions"))
PROF = Path(os.environ["APPDATA"]) / "Cursor" / "User" / "profiles" / "-48f7a497"
EXTRA = ["bierner.markdown-mermaid"]


def path_posix(p: Path) -> str:
    win = str(p.resolve()).replace("\\", "/")
    if len(win) >= 2 and win[1] == ":":
        return f"/{win[0].lower()}:{win[2:]}"
    return win


def find(want_id: str) -> Path | None:
    want_l = want_id.lower()
    best = None
    best_ver = ""
    for d in EXT_ROOT.iterdir():
        if not d.is_dir():
            continue
        if not d.name.lower().startswith(want_l + "-"):
            continue
        pkg = d / "package.json"
        if not pkg.is_file():
            continue
        meta = json.loads(pkg.read_text(encoding="utf-8"))
        ver = meta.get("version", "0")
        if best is None or ver > best_ver:
            best = d
            best_ver = ver
    return best


def main() -> None:
    path = PROF / "extensions.json"
    entries = json.loads(path.read_text(encoding="utf-8"))
    ids = {e["identifier"]["id"] for e in entries}
    for wid in EXTRA:
        if wid in ids:
            print("already", wid)
            continue
        d = find(wid)
        if not d:
            print("missing install", wid)
            continue
        meta = json.loads((d / "package.json").read_text(encoding="utf-8"))
        entries.append(
            {
                "identifier": {"id": wid},
                "version": meta.get("version", "0.0.0"),
                "location": {"$mid": 1, "path": path_posix(d), "scheme": "file"},
                "relativeLocation": d.name,
                "metadata": {
                    "installedTimestamp": int(d.stat().st_mtime * 1000),
                    "source": "gallery",
                    "pinned": False,
                    "isPreReleaseVersion": False,
                    "hasPreReleaseVersion": False,
                    "updated": False,
                    "private": False,
                },
            }
        )
        print("added", wid, d.name)
    path.write_text(json.dumps(entries, ensure_ascii=False), encoding="utf-8")
    print("total", len(entries))


if __name__ == "__main__":
    main()
