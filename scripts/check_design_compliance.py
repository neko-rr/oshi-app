#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""apps/web のデザイン規約を静的検査する。

使い方:
  python scripts/check_design_compliance.py
  python scripts/check_design_compliance.py --check-staged
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB_SRC = ROOT / "apps" / "web" / "src"

# トークン定義・Lab モック・カラータグ（製品ラベル色データ）は hex を許可
ALLOW_HEX_GLOBS = (
    "styles/colors.css",
    "styles/tailwind-theme.css",
    "styles/design-lab.css",
    "components/design-lab/",
    # テーマ選択スウォッチ用カタログ（部品本体への直書きではない）
    "lib/themes/",
    # 推し色スウォッチ・コントラスト計算（色データ本体。UI 部品への直書きではない）
    "lib/oshiContrast.ts",
    "lib/oshiContrast.selftest.ts",
    "lib/oshiAccentPrefs.ts",
    "components/settings/OshiAccentPanel.tsx",
    # カラータグ / カテゴリ色は製品ラベル用（推し色・UI トークンとは別）
    "app/settings/color-tags/",
    "app/settings/category-tags/",
    "app/[locale]/settings/color-tags/",
    "app/[locale]/settings/category-tags/",
)
ALLOW_RAW_BUTTON_GLOBS = (
    "components/design-lab/",
    "components/ui/button.tsx",
)
ALLOW_LUCIDE_DIRECT = {
    "lib/icons.ts",
}

HEX_RE = re.compile(r"#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b")
# 正規表現リテラル内の # はバリデーション用なので無視
HEX_IN_REGEX_RE = re.compile(r"/\#\[0-9A-Fa-f\]")
LUCIDE_IMPORT_RE = re.compile(
    r"""from\s+['"]lucide-react['"]|require\(\s*['"]lucide-react['"]\s*\)"""
)
RAW_BUTTON_RE = re.compile(r"<\s*button\b")

STAGED_PREFIX = "apps/web/"


@dataclass
class Finding:
    path: str
    line: int
    kind: str
    detail: str


def rel_posix(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def under_web_src(path: Path) -> str:
    return str(path.relative_to(WEB_SRC)).replace("\\", "/")


def is_allowed(rel: str, allow_prefixes: tuple[str, ...]) -> bool:
    return any(rel == p.rstrip("/") or rel.startswith(p) for p in allow_prefixes)


def line_has_ui_hex(line: str) -> bool:
    """UI 直書き hex か。正規表現バリデータ内は除外。"""
    if HEX_IN_REGEX_RE.search(line):
        # 行にバリデータがある場合でも、別の '#rrggbb' リテラルがあれば検出する
        stripped = HEX_IN_REGEX_RE.sub("", line)
        return bool(HEX_RE.search(stripped))
    return bool(HEX_RE.search(line))


def iter_source_files(limit_to: set[str] | None) -> list[Path]:
    if not WEB_SRC.is_dir():
        return []
    files: list[Path] = []
    for path in WEB_SRC.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".ts", ".tsx", ".css"}:
            continue
        if "node_modules" in path.parts or ".next" in path.parts:
            continue
        rel_root = rel_posix(path)
        if limit_to is not None and rel_root not in limit_to:
            continue
        files.append(path)
    return sorted(files)


def staged_web_files() -> set[str]:
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
    result: set[str] = set()
    for line in out.stdout.splitlines():
        p = line.strip().replace("\\", "/")
        if p.startswith(STAGED_PREFIX) and p.endswith((".ts", ".tsx", ".css")):
            result.add(p)
    return result


def scan_file(path: Path) -> list[Finding]:
    findings: list[Finding] = []
    rel = under_web_src(path)
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    allow_hex = is_allowed(rel, ALLOW_HEX_GLOBS)
    allow_button = is_allowed(rel, ALLOW_RAW_BUTTON_GLOBS)
    allow_lucide = rel in ALLOW_LUCIDE_DIRECT

    for i, line in enumerate(lines, start=1):
        stripped = line.lstrip()
        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue

        if not allow_hex and line_has_ui_hex(line):
            findings.append(
                Finding(
                    path=rel_posix(path),
                    line=i,
                    kind="hex_literal",
                    detail="画面・部品への hex 直書き禁止。styles トークン経由にせよ（カラータグ設定は例外）。",
                )
            )

        if not allow_lucide and LUCIDE_IMPORT_RE.search(line):
            findings.append(
                Finding(
                    path=rel_posix(path),
                    line=i,
                    kind="lucide_direct_import",
                    detail="lucide-react 直 import 禁止。@/lib/icons から named import。",
                )
            )

        if not allow_button and RAW_BUTTON_RE.search(line):
            findings.append(
                Finding(
                    path=rel_posix(path),
                    line=i,
                    kind="raw_button",
                    detail="生 <button> 禁止。@/components/ui/button を使え（Lab / ui は例外）。",
                )
            )

    return findings


def run_check(limit_to: set[str] | None) -> int:
    all_findings: list[Finding] = []
    for path in iter_source_files(limit_to):
        all_findings.extend(scan_file(path))

    if not all_findings:
        print("design compliance: OK")
        return 0

    print("design compliance: FAIL")
    for f in all_findings:
        print(f"  {f.path}:{f.line} [{f.kind}] {f.detail}")
    print("正本: docs/design/ + skill design-change / check: pnpm check:design")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="design compliance 検査")
    parser.add_argument(
        "--check-staged",
        action="store_true",
        help="apps/web の staged ファイルだけ検査（無ければ skip）",
    )
    args = parser.parse_args()

    if args.check_staged:
        staged = staged_web_files()
        if not staged:
            return 0
        return run_check(staged)

    return run_check(None)


if __name__ == "__main__":
    raise SystemExit(main())
