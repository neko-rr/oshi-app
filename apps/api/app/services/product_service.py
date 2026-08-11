# 製品ユースケース（DB 接続は後続。TDD で骨だけ）

from __future__ import annotations


def list_products_for_member(members_id: str) -> list[dict]:
    """ユーザー所有の製品一覧。RLS 前提の実装に置き換える。

    現時点は空リスト（未配線）。
    """
    if not members_id or not str(members_id).strip():
        raise ValueError("members_id が空です")
    return []
