#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""docs/design/meta/tokens.json と colors.css / tailwind-theme.css の名前整合を検査する（値は生成しない）。

使い方:
  python scripts/check_design_tokens.py
  python scripts/check_design_tokens.py --check-staged
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / "docs" / "design" / "meta" / "tokens.json"

VAR_DECL_RE = re.compile(r"--([a-z0-9-]+)\s*:")
COLOR_BRIDGE_RE = re.compile(r"--color-([a-z0-9-]+)\s*:\s*var\(--([a-z0-9-]+)\)")
RADIUS_BRIDGE_RE = re.compile(r"--radius-(?:sm|md|lg|xl)\s*:")

STAGED_TRIGGER_PATHS = {
    "docs/design/meta/tokens.json",
    "apps/web/src/styles/colors.css",
    "apps/web/src/styles/tailwind-theme.css",
    "docs/design/tokens.md",
}


def load_meta() -> dict[str, Any]:
    if not META.is_file():
        raise FileNotFoundError(f"正本がありません: {META.relative_to(ROOT)}")
    data = json.loads(META.read_text(encoding="utf-8"))
    if not isinstance(data.get("required_semantic"), list):
        raise ValueError("tokens.json: required_semantic は配列必須")
    return data


def extract_root_vars(css_text: str) -> set[str]:
    """最初の :root { ... } ブロック内の --name を集める（テーマ別 :root[data-theme] は除外）。"""
    m = re.search(r":root\s*\{", css_text)
    if not m:
        return set()
    start = m.end()
    depth = 1
    i = start
    while i < len(css_text) and depth:
        ch = css_text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
        i += 1
    block = css_text[start : i - 1]
    return set(VAR_DECL_RE.findall(block))


def extract_tailwind_bridges(css_text: str) -> dict[str, str]:
    """--color-X: var(--Y) の対応。"""
    return {color: var for color, var in COLOR_BRIDGE_RE.findall(css_text)}


def check_tokens(data: dict[str, Any] | None = None) -> list[str]:
    data = data or load_meta()
    css_rel = str(data.get("css_source") or "apps/web/src/styles/colors.css")
    tw_rel = str(data.get("tailwind_bridge") or "apps/web/src/styles/tailwind-theme.css")
    css_path = ROOT / css_rel.replace("\\", "/")
    tw_path = ROOT / tw_rel.replace("\\", "/")

    errors: list[str] = []
    if not css_path.is_file():
        errors.append(f"colors.css がありません: {css_rel}")
        return errors
    if not tw_path.is_file():
        errors.append(f"tailwind-theme.css がありません: {tw_rel}")
        return errors

    root_vars = extract_root_vars(css_path.read_text(encoding="utf-8"))
    bridges = extract_tailwind_bridges(tw_path.read_text(encoding="utf-8"))
    tw_text = tw_path.read_text(encoding="utf-8")

    for name in data["required_semantic"]:
        if name not in root_vars:
            errors.append(f"colors.css :root に --{name} がありません")

    for name in data.get("required_tailwind_bridge") or []:
        if name not in bridges:
            errors.append(f"tailwind-theme.css に --color-{name}: var(--…) がありません")
        elif bridges[name] != name:
            errors.append(
                f"bridge 不一致: --color-{name} → var(--{bridges[name]})（期待: var(--{name})）"
            )

    if "radius" in data["required_semantic"] and not RADIUS_BRIDGE_RE.search(tw_text):
        errors.append("tailwind-theme.css に --radius-sm/md/lg/xl 橋渡しがありません")

    return errors


def staged_trigger_files() -> set[str]:
    try:
        out = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            check=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return set()
    paths = {line.strip().replace("\\", "/") for line in out.stdout.splitlines() if line.strip()}
    return paths & STAGED_TRIGGER_PATHS


def main() -> int:
    parser = argparse.ArgumentParser(description="design tokens 名前整合検査")
    parser.add_argument(
        "--check-staged",
        action="store_true",
        help="tokens 関連が staged のときだけ検査",
    )
    args = parser.parse_args()

    if args.check_staged and not staged_trigger_files():
        return 0

    try:
        errors = check_tokens()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"design tokens: ERROR {exc}")
        return 1

    if errors:
        print("design tokens: FAIL")
        for e in errors:
            print(f"  - {e}")
        print("正本: docs/design/meta/tokens.json（値の自動生成はまだしない）")
        return 1

    print("design tokens: OK（required 名が colors.css / tailwind bridge に存在）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
