"""Supabase への挿入を試す旧スクリプト。import 時に DB に触れないよう、既定 pytest ではスキップする。"""

import pytest

pytest.skip(
    "統合テスト: RUN_SUPABASE_INTEGRATION=1 と認可済み環境で別途実行する想定。",
    allow_module_level=True,
)
