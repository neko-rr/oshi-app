"""ゲストの外部アシスト回数（楽天照合と写真抽出の合計。プロセス内・1時間3回）。

複数インスタンスでは共有しない。デモの上限であり、保存の認可ではない。
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass

WINDOW_SECONDS = 3600
MAX_LOOKUPS = 3

_lock = threading.Lock()
_hits: dict[str, list[float]] = {}


@dataclass(frozen=True)
class LookupQuotaDecision:
    allowed: bool
    remaining: int


def reset_guest_lookup_quota() -> None:
    with _lock:
        _hits.clear()


def consume_lookup(
    members_id: str,
    now: float | None = None,
) -> LookupQuotaDecision:
    member = members_id.strip()
    if not member:
        return LookupQuotaDecision(allowed=False, remaining=0)
    ts = time.time() if now is None else now
    with _lock:
        window_start = ts - WINDOW_SECONDS
        recent = [hit for hit in _hits.get(member, []) if hit > window_start]
        if len(recent) >= MAX_LOOKUPS:
            _hits[member] = recent
            return LookupQuotaDecision(allowed=False, remaining=0)
        recent.append(ts)
        _hits[member] = recent
        return LookupQuotaDecision(
            allowed=True,
            remaining=MAX_LOOKUPS - len(recent),
        )
