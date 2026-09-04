"""一覧クエリの ID リスト正規化（カンマ区切り互換）。"""

from __future__ import annotations

from typing import Any


def parse_positive_id_list(
    raw: Any,
    *,
    field: str,
    max_items: int = 50,
    max_value: int | None = None,
) -> list[int]:
    """単一 int / CSV 文字列 / list → 正の整数リスト。空は []。"""
    if raw is None:
        return []
    parts: list[Any]
    if isinstance(raw, bool):
        raise ValueError(f"未対応のフィルタです（{field}）")
    if isinstance(raw, int):
        parts = [raw]
    elif isinstance(raw, str):
        parts = [p.strip() for p in raw.split(",") if p.strip()]
    elif isinstance(raw, (list, tuple)):
        parts = list(raw)
    else:
        raise ValueError(f"未対応のフィルタです（{field}）")

    out: list[int] = []
    seen: set[int] = set()
    for part in parts:
        try:
            n = int(part)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"未対応のフィルタです（{field}）") from exc
        if n < 1:
            raise ValueError(f"未対応のフィルタです（{field}）")
        if max_value is not None and n > max_value:
            raise ValueError(f"未対応のフィルタです（{field}）")
        if n in seen:
            continue
        seen.add(n)
        out.append(n)
        if len(out) > max_items:
            raise ValueError(f"未対応のフィルタです（{field}）")
    return out
