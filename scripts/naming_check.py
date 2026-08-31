#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""新規コード向けの軽い命名チェック。

secret_guard ほど厳しくない。警告レベルもあり、明確な禁止だけ fail。
使い方:
  python scripts/naming_check.py check-staged
  python scripts/naming_check.py check-paths a b
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# コードとみなす拡張子
CODE_SUFFIXES = {
    ".py",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".sql",
}

# チェック対象から外す
SKIP_PREFIXES = (
    ".cursor/plans/",
    "docs/archive/",
    "docs/migration/v2/",  # 移行ドキュメント自体は日本語可
    "node_modules/",
    ".git/",
)

# ディレクトリ名として禁止（パス断片）
FORBIDDEN_DIR_NAMES = {
    "controller",  # Dash 残骸
}

# ファイル名パターン禁止
FORBIDDEN_FILE_RES = [
    (re.compile(r"controller\.py$", re.I), "Dash の controller.py は v2 で新規禁止"),
    (re.compile(r"_final\d*\.", re.I), "一時名 _final は禁止"),
    (re.compile(r"^copy_", re.I), "copy_ プレフィックスは禁止"),
    (re.compile(r"^temp_", re.I), "temp_ プレフィックスは禁止"),
]

# 日本語を含むコードファイル名
JA_IN_NAME = re.compile(r"[\u3040-\u30ff\u3400-\u9fff]")

# Python モジュール名は snake
PY_BAD = re.compile(r"[A-Z]")

# React コンポーネントは PascalCase.tsx（hooks と page.tsx layout は例外）
NEXT_FIXED = {
    "page.tsx",
    "layout.tsx",
    "loading.tsx",
    "error.tsx",
    "not-found.tsx",
    "route.ts",
    "route.tsx",
    "template.tsx",
    "default.tsx",
    "middleware.ts",
    "globals.css",
}


def _norm(p: str) -> str:
    return str(p).replace("\\", "/").lstrip("./")


def should_skip(path: str) -> bool:
    n = _norm(path)
    if any(n.startswith(s) or f"/{s}" in f"/{n}" for s in SKIP_PREFIXES):
        return True
    if n.endswith(".md"):
        return True
    if Path(n).suffix.lower() not in CODE_SUFFIXES:
        return True
    return False


def check_one(path: str) -> list[str]:
    if should_skip(path):
        return []
    n = _norm(path)
    name = Path(n).name
    issues: list[str] = []

    for part in Path(n).parts[:-1]:
        if part.lower() in FORBIDDEN_DIR_NAMES:
            issues.append(f"{n}: 禁止ディレクトリ名 '{part}'")

    if JA_IN_NAME.search(name):
        issues.append(f"{n}: コードファイル名に日本語は禁止")

    for cre, msg in FORBIDDEN_FILE_RES:
        if cre.search(name):
            issues.append(f"{n}: {msg}")

    # apps/api の Python
    if "/apps/api/" in f"/{n}" or n.startswith("apps/api/"):
        if name.endswith(".py") and name != "__init__.py":
            stem = name[:-3]
            if PY_BAD.search(stem) or "-" in stem:
                issues.append(f"{n}: Python モジュールは snake_case")
            if name == "photo_service.py":
                issues.append(
                    f"{n}: 警告 — 新規は product_service / storage 分割を推奨（glossary）"
                )

    # apps/web の TSX
    if "/apps/web/" in f"/{n}" or n.startswith("apps/web/"):
        if name.endswith(".tsx") and name not in NEXT_FIXED:
            # shadcn / Auth UI 系は components/ 配下で kebab-case を許容
            under_components = "/components/" in f"/{n}" or n.startswith(
                "apps/web/src/components/"
            )
            if name.startswith("use"):
                pass  # useXxx.tsx は稀
            elif under_components and re.match(
                r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*\.tsx$", name
            ):
                pass
            elif not re.match(r"^[A-Z][A-Za-z0-9]*\.tsx$", name):
                # hooks の use-xxx は .ts が多い
                if not (name.startswith("use") and name[0].islower()):
                    issues.append(
                        f"{n}: React コンポーネントは PascalCase.tsx"
                        "（components/ の kebab と Next 固定名を除く）"
                    )
        if name.endswith(".ts") and name.startswith("use"):
            if not re.match(r"^use[A-Z][A-Za-z0-9]*\.ts$", name) and not re.match(
                r"^use-[a-z0-9-]+\.ts$", name
            ):
                issues.append(f"{n}: フックは useXxx.ts を推奨")

    return issues


def staged_files() -> list[str]:
    out = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if out.returncode != 0:
        return []
    return [ln.strip() for ln in out.stdout.splitlines() if ln.strip()]


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: naming_check.py check-staged | check-paths <paths...>", file=sys.stderr)
        return 2
    cmd = argv[1]
    paths: list[str]
    if cmd == "check-staged":
        paths = staged_files()
    elif cmd == "check-paths":
        paths = argv[2:]
    else:
        print(f"unknown: {cmd}", file=sys.stderr)
        return 2

    hard: list[str] = []
    soft: list[str] = []
    for p in paths:
        for issue in check_one(p):
            if "警告" in issue:
                soft.append(issue)
            else:
                hard.append(issue)

    for s in soft:
        print(f"[warn] {s}", file=sys.stderr)
    if hard:
        print("=== naming_check: 命名規則違反 ===", file=sys.stderr)
        for h in hard:
            print(f"  - {h}", file=sys.stderr)
        print("参照: .cursor/rules/naming.md / docs/migration/v2/glossary.md", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
