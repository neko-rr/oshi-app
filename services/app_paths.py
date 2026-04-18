"""リポジトリルート基準のパス（ログ出力先の単一化）。"""
import os

_SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(_SERVICES_DIR)
LOG_DIR = os.path.join(PROJECT_ROOT, "logs")


def ensure_log_dir() -> None:
    """アプリが書き込む logs/ を確保する。"""
    os.makedirs(LOG_DIR, exist_ok=True)


def log_file_path(filename: str) -> str:
    """logs/ 配下のファイルの絶対パスを返す。"""
    return os.path.join(LOG_DIR, filename)
