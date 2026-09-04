#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Web messages（ja/en）のキー集合一致検査。

使い方:
  python scripts/check_i18n_message_keys.py

値の翻訳品質は見ない。欠落・余剰キーだけを fail にする。
CI で en.json を自動生成・上書きしない。
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, NamedTuple

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JA = ROOT / "apps" / "web" / "messages" / "ja.json"
DEFAULT_EN = ROOT / "apps" / "web" / "messages" / "en.json"


def flatten_message_keys(obj: Any, prefix: str = "") -> set[str]:
    """ネストした messages JSON をドット区切りキー集合にする。"""
    if not isinstance(obj, dict):
        if not prefix:
            return set()
        return {prefix}
    keys: set[str] = set()
    for raw_key, value in obj.items():
        key = str(raw_key)
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            keys |= flatten_message_keys(value, path)
        else:
            keys.add(path)
    return keys


def diff_message_keys(
    ja: dict[str, Any],
    en: dict[str, Any],
) -> tuple[list[str], list[str]]:
    """(en に無いキー, ja に無いキー) をソート済みで返す。"""
    ja_keys = flatten_message_keys(ja)
    en_keys = flatten_message_keys(en)
    missing_in_en = sorted(ja_keys - en_keys)
    missing_in_ja = sorted(en_keys - ja_keys)
    return missing_in_en, missing_in_ja


class CompareResult(NamedTuple):
    ok: bool
    missing_in_en: list[str]
    missing_in_ja: list[str]
    ja_count: int
    en_count: int


def compare_message_files(ja_path: Path, en_path: Path) -> CompareResult:
    ja = json.loads(ja_path.read_text(encoding="utf-8"))
    en = json.loads(en_path.read_text(encoding="utf-8"))
    if not isinstance(ja, dict) or not isinstance(en, dict):
        raise ValueError("messages JSON のトップは object である必要があります")
    missing_en, missing_ja = diff_message_keys(ja, en)
    ja_count = len(flatten_message_keys(ja))
    en_count = len(flatten_message_keys(en))
    return CompareResult(
        ok=not missing_en and not missing_ja,
        missing_in_en=missing_en,
        missing_in_ja=missing_ja,
        ja_count=ja_count,
        en_count=en_count,
    )


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    ja_path = Path(args[0]) if len(args) >= 1 else DEFAULT_JA
    en_path = Path(args[1]) if len(args) >= 2 else DEFAULT_EN
    if not ja_path.is_file():
        print(f"check_i18n_message_keys: ja が見つかりません: {ja_path}", file=sys.stderr)
        return 1
    if not en_path.is_file():
        print(f"check_i18n_message_keys: en が見つかりません: {en_path}", file=sys.stderr)
        return 1

    result = compare_message_files(ja_path, en_path)
    if result.ok:
        print(
            f"i18n-message-keys: OK（ja={result.ja_count} en={result.en_count}）"
        )
        return 0

    print("=== i18n-message-keys: ja/en キー不一致 ===", file=sys.stderr)
    if result.missing_in_en:
        print(f"en に無い（{len(result.missing_in_en)}）:", file=sys.stderr)
        for key in result.missing_in_en[:50]:
            print(f"  - {key}", file=sys.stderr)
        if len(result.missing_in_en) > 50:
            print(
                f"  …他 {len(result.missing_in_en) - 50} 件",
                file=sys.stderr,
            )
    if result.missing_in_ja:
        print(f"ja に無い（{len(result.missing_in_ja)}）:", file=sys.stderr)
        for key in result.missing_in_ja[:50]:
            print(f"  - {key}", file=sys.stderr)
        if len(result.missing_in_ja) > 50:
            print(
                f"  …他 {len(result.missing_in_ja) - 50} 件",
                file=sys.stderr,
            )
    print(
        "直し方: ja.json を正本に en.json を揃える。skill i18n-web-sync 参照。"
        " CI は en を自動上書きしない。",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
