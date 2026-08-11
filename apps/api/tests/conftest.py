# -*- coding: utf-8 -*-
"""API 用 conftest: アプリルートを path に入れる。"""
from __future__ import annotations

import sys
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))
