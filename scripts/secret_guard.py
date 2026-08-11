#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""秘密情報・個人情報の誤コミット / 危険操作ガード。

使い方:
  1) CLI（Git pre-commit 等）:
       python scripts/secret_guard.py check-staged
       python scripts/secret_guard.py check-paths path1 path2
  2) モジュール:
       from scripts ではなく、同ファイルを subprocess / importlib で実行
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Iterable

# リポジトリルート（このファイルの親の親）
ROOT = Path(__file__).resolve().parents[1]

# ファイル名として拒否（例以外）
FORBIDDEN_NAME_EXACT = {
    ".env",
    "credentials.json",
    "application_default_credentials.json",
    "id_rsa",
    "id_ed25519",
}

FORBIDDEN_NAME_SUFFIXES = (
    ".pem",
    ".key",
    ".p12",
    ".pfx",
    ".keystore",
)

FORBIDDEN_NAME_CONTAINS = (
    "service-account",
    "firebase-adminsdk",
)

# パス断片（区切り正規化後）
FORBIDDEN_PATH_PARTS = (
    "/.env.",  # .env.local 等。.env.example は下で許可
    "/secrets/",
    "/.private/",
    "/supabase/.temp/",
    "/.aws/",
    "/.gcloud/",
)

# 実キーっぽい割当（.env.example の空値は除外）
CONTENT_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    (
        "private_key_block",
        re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    ),
    (
        "supabase_service_role_hint",
        re.compile(r"(?i)(service_role|SUPABASE_SECRET)[^\n]{0,40}=[^\n]{20,}"),
    ),
    (
        "github_pat",
        re.compile(r"\bghp_[A-Za-z0-9]{20,}\b"),
    ),
    (
        "github_fine_grained",
        re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b"),
    ),
    (
        "aws_access_key",
        re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    ),
    (
        "slack_token",
        re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b"),
    ),
    (
        "generic_bearer_assign",
        re.compile(
            r"(?i)(api[_-]?key|access[_-]?token|refresh[_-]?token|client_secret)\s*[=:]\s*['\"][A-Za-z0-9_\-\.+/=]{24,}['\"]"
        ),
    ),
]

# テンプレートとして許可するファイル名
ALLOWED_ENV_TEMPLATES = {".env.example"}


def _norm_path(p: str | Path) -> str:
    s = str(p).replace("\\", "/")
    if not s.startswith("/"):
        s = "/" + s
    return s


def is_allowed_template(path: str | Path) -> bool:
    name = Path(path).name
    return name in ALLOWED_ENV_TEMPLATES


def path_is_forbidden(path: str | Path) -> str | None:
    """禁止なら理由文字列、OK なら None。"""
    if is_allowed_template(path):
        return None

    name = Path(path).name
    n = _norm_path(path)

    if name in FORBIDDEN_NAME_EXACT:
        return f"禁止ファイル名: {name}"
    if name.startswith(".env"):
        return f"環境変数実ファイルは禁止: {name}（.env.example のみ可）"
    for suf in FORBIDDEN_NAME_SUFFIXES:
        if name.endswith(suf):
            return f"鍵・証明書の可能性: {name}"
    lower = name.lower()
    for frag in FORBIDDEN_NAME_CONTAINS:
        if frag in lower:
            return f"サービスアカウント系ファイル: {name}"
    for part in FORBIDDEN_PATH_PARTS:
        if part in n:
            # .env.example は上で return 済み
            if part == "/.env." and n.endswith(".env.example"):
                continue
            return f"禁止パス断片 '{part}': {path}"
    return None


# テンプレでも「値が入っていたら危険」とみなすキー
_SECRETISH_KEY = re.compile(
    r"(?i)(secret|token|password|passwd|api[_-]?key|private|service[_-]?role|"
    r"database_url|jwt|credential|access[_-]?key|client_secret|publishable.*key|"
    r"supabase.*key|health_test_user|test_members_id)"
)


def _looks_like_placeholder(val: str) -> bool:
    v = val.lower()
    if not v:
        return True
    if v.startswith("http://") or v.startswith("https://"):
        # 公開 URL は example に書いてよい（ローカル・ダミー向け）
        return True
    if any(x in v for x in ("your-", "xxx", "example", "dummy", "changeme", "todo", "<", "placeholder")):
        return True
    # モデル ID（org/model）は秘密ではない
    if "/" in val and " " not in val and len(val) < 200:
        return True
    # true/false/短いフラグ
    if v in {"0", "1", "true", "false", "lax", "strict", "none"}:
        return True
    return False


def content_violations(text: str, path: str = "") -> list[str]:
    """中身スキャン。テンプレは秘密系キーに実値がある場合のみ警告。"""
    hits: list[str] = []
    if is_allowed_template(path):
        for line in text.splitlines():
            s = line.strip()
            if not s or s.startswith("#") or "=" not in s:
                continue
            key, _, val = s.partition("=")
            key = key.strip()
            val = val.strip().strip("'\"")
            if not val or _looks_like_placeholder(val):
                continue
            if _SECRETISH_KEY.search(key) and len(val) >= 8:
                hits.append(f"テンプレに秘密っぽい実値: {key}")
        return hits

    for label, pat in CONTENT_PATTERNS:
        if pat.search(text):
            hits.append(label)
    return hits


def check_file_on_disk(path: Path) -> list[str]:
    reasons: list[str] = []
    rel = path.as_posix()
    pr = path_is_forbidden(rel)
    if pr:
        reasons.append(pr)
        return reasons
    try:
        if path.is_file() and path.stat().st_size <= 2_000_000:
            text = path.read_text(encoding="utf-8", errors="replace")
            for h in content_violations(text, rel):
                reasons.append(f"{rel}: {h}")
    except OSError as exc:
        reasons.append(f"{rel}: 読み取り失敗 ({exc})")
    return reasons


def git_staged_files() -> list[str]:
    try:
        out = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        print("git が見つかりません", file=sys.stderr)
        return []
    if out.returncode != 0:
        return []
    return [line.strip() for line in out.stdout.splitlines() if line.strip()]


def git_show_staged(path: str) -> str:
    out = subprocess.run(
        ["git", "show", f":{path}"],
        cwd=ROOT,
        capture_output=True,
        check=False,
    )
    if out.returncode != 0:
        return ""
    try:
        return out.stdout.decode("utf-8", errors="replace")
    except Exception:
        return ""


def check_staged() -> int:
    files = git_staged_files()
    if not files:
        return 0
    bad: list[str] = []
    for f in files:
        pr = path_is_forbidden(f)
        if pr:
            bad.append(f"{f}: {pr}")
            continue
        text = git_show_staged(f)
        if text:
            for h in content_violations(text, f):
                bad.append(f"{f}: {h}")
    if bad:
        print("=== secret_guard: コミットを拒否しました ===", file=sys.stderr)
        for b in bad:
            print(f"  - {b}", file=sys.stderr)
        print(
            "秘密情報は .env 等のローカルのみに置き、.env.example はキー名のみにしてください。",
            file=sys.stderr,
        )
        return 1
    return 0


def check_paths(paths: Iterable[str]) -> int:
    bad: list[str] = []
    for p in paths:
        path = Path(p)
        if not path.is_absolute():
            path = ROOT / path
        if path.is_dir():
            continue
        bad.extend(check_file_on_disk(path))
    if bad:
        print("=== secret_guard: 問題のあるパス ===", file=sys.stderr)
        for b in bad:
            print(f"  - {b}", file=sys.stderr)
        return 1
    return 0


def shell_command_is_dangerous(cmd: str) -> str | None:
    """Cursor beforeShellExecution 用。危険なら理由。"""
    c = cmd.strip()
    lower = c.lower()

    # .env を add / commit 対象に含める操作
    env_add = re.search(
        r"\bgit\s+add\b[^\n]*(\.env\b|\.env\.|/credentials\.json|service-account)",
        lower,
    )
    if env_add and ".env.example" not in lower:
        return "git add が秘密ファイル（.env 等）を含んでいる可能性があります"

    if re.search(r"\bgit\s+add\s+(-A|--all|\.)\b", lower):
        # ブロッカーではなく注意（pre-commit が最後の砦）
        # ただし --force で ignore を破るのは拒否
        pass

    if re.search(r"\bgit\s+add\s+.*(-f|--force).*\.env", lower) and ".env.example" not in lower:
        return "git add --force で .env を載せようとしています"

    if re.search(r"\bgit\s+commit\b[^\n]*--no-verify", lower) or re.search(
        r"\bgit\s+commit\b[^\n]*-n\b", lower
    ):
        return "pre-commit をスキップする commit は禁止です（秘密検査を回避するため）"

    # 環境変数値のエコー（簡易）
    if re.search(
        r"\b(type|get-content|cat|printenv|echo)\b[^\n]*\.env\b",
        lower,
    ) and ".env.example" not in lower:
        return ".env の中身をターミナルに出すコマンドは避けてください（ログ漏洩防止）"

    return None


def path_write_is_dangerous(path: str) -> str | None:
    """Write/Edit 先が秘密ファイルなら理由。"""
    if not path:
        return None
    # 例テンプレへの書き込みは許可（中身は content 側で抑制しづらいので path のみ）
    if is_allowed_template(path):
        return None
    return path_is_forbidden(path)


def _hook_allow() -> int:
    print(json.dumps({"permission": "allow"}))
    return 0


def _hook_deny(user_message: str, agent_message: str) -> int:
    print(
        json.dumps(
            {
                "permission": "deny",
                "user_message": user_message,
                "agent_message": agent_message,
            },
            ensure_ascii=False,
        )
    )
    return 0


def run_as_cursor_hook() -> int:
    """stdin JSON を読み、Cursor hook レスポンスを stdout へ。

    beforeShellExecution: command フィールド
    preToolUse (Write/StrReplace): tool_input.path

    常に exit 0（failClosed で誤ブロックしない）。
    """
    try:
        raw = sys.stdin.read()
        try:
            data = json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            data = {}
        if not isinstance(data, dict):
            data = {}

        tool_input = data.get("tool_input") or data.get("input") or data.get("arguments") or {}
        if not isinstance(tool_input, dict):
            tool_input = {}

        # Shell 系（beforeShellExecution）
        cmd = data.get("command") or tool_input.get("command") or ""
        if isinstance(cmd, str) and cmd.strip():
            reason = shell_command_is_dangerous(cmd)
            if reason:
                return _hook_deny(
                    f"セキュリティ: {reason}",
                    f"Blocked by secret_guard: {reason}. "
                    "Do not stage or display secret files. Use .env.example only.",
                )
            return _hook_allow()

        # Write / StrReplace 系
        path = (
            tool_input.get("path")
            or tool_input.get("file_path")
            or tool_input.get("target_notebook")
            or data.get("path")
            or ""
        )
        if isinstance(path, str) and path.strip():
            reason = path_write_is_dangerous(path)
            if reason:
                return _hook_deny(
                    f"セキュリティ: 秘密ファイルへの書き込みを拒否 ({reason})",
                    f"Blocked write to secret path: {reason}. "
                    "Edit .env only via local user action; agents should use .env.example.",
                )
        return _hook_allow()
    except Exception as exc:
        # 検査ロジックの障害で編集を止めない（pre-commit が最終防衛）
        print(f"secret_guard hook error: {exc}", file=sys.stderr)
        return _hook_allow()


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(
            "Usage: secret_guard.py check-staged | check-paths <paths...> | hook",
            file=sys.stderr,
        )
        return 2
    cmd = argv[1]
    if cmd == "check-staged":
        return check_staged()
    if cmd == "check-paths":
        return check_paths(argv[2:])
    if cmd == "hook":
        return run_as_cursor_hook()
    print(f"unknown command: {cmd}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
