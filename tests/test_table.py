"""手動・統合向けの旧スクリプト。既定の pytest ではスキップする。"""

import pytest

pytest.skip(
    "手動検証用（TEST_MEMBERS_ID と認可済みクライアントが必要）。必要ならこのファイルを関数化して統合マーカーで有効化する。",
    allow_module_level=True,
)
