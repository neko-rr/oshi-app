"""開発用ログ。本番では環境変数をオフにする。"""
import os


def is_dash_debug() -> bool:
    return os.getenv("DASH_DEBUG", "").lower() in {"1", "true", "yes"}


def dash_debug_print(message: str) -> None:
    """DASH_DEBUG=1 のときだけ print する。"""
    if is_dash_debug():
        print(message)
