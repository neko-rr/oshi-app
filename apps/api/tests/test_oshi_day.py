# TDD: キャラごとの推し何日目。開始日は1日目。未来日は数えない。
from __future__ import annotations

from datetime import date

from app.services.oshi_day_service import build_oshi_day_rows, oshi_day_count


def test_oshi_day_count_includes_start_day() -> None:
    count, future = oshi_day_count(date(2026, 10, 12), date(2026, 10, 12))
    assert count == 1
    assert future is False
    count, future = oshi_day_count(date(2026, 10, 10), date(2026, 10, 12))
    assert count == 3
    assert future is False


def test_oshi_day_count_future_has_no_number() -> None:
    count, future = oshi_day_count(date(2026, 12, 1), date(2026, 10, 12))
    assert count is None
    assert future is True


def test_build_oshi_day_rows_merges_product_names_and_saved_dates() -> None:
    rows = build_oshi_day_rows(
        names=["風ねこ", " 風ねこ "],
        saved=[
            {"character_name": "風ねこ", "start_date": "2026-10-10"},
            {"character_name": "未登録", "start_date": "2026-10-12"},
        ],
        today=date(2026, 10, 12),
    )
    by_name = {row["character_name"]: row for row in rows}
    assert by_name["風ねこ"]["day_count"] == 3
    assert by_name["未登録"]["day_count"] == 1
    assert len(rows) == 2
