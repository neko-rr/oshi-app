# -*- coding: utf-8 -*-
"""Web-Oshi 用 .code-profile を生成する（Cursor の Import で認識される正式形式）。

手で userDataProfiles を書き換えても、Cursor 起動中は上書きされ UI に出ない。
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".vscode" / "profiles" / "Web-Oshi.code-profile"

EXTENSIONS = [
    "ms-python.python",
    "ms-python.debugpy",
    "ms-python.isort",
    "charliermarsh.ruff",
    "anysphere.cursorpyright",
    "njpwerner.autodocstring",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "xabikos.javascriptsnippets",
    "formulahendry.auto-close-tag",
    "formulahendry.auto-rename-tag",
    "ecmel.vscode-html-css",
    "zignd.html-css-class-completion",
    "christian-kohler.path-intellisense",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker",
    "mikestead.dotenv",
    "mhutchie.git-graph",
    "codezombiech.gitignore",
    "vscode-icons-team.vscode-icons",
    "yzhang.markdown-all-in-one",
    "ms-ceintl.vscode-language-pack-ja",
    "ms-azuretools.vscode-docker",
    "ms-azuretools.vscode-containers",
]

SETTINGS = {
    "editor.formatOnSave": True,
    "files.autoSave": "afterDelay",
    "workbench.iconTheme": "vscode-icons",
    "git.autofetch": True,
    "python.testing.pytestEnabled": True,
    "python.testing.unittestEnabled": False,
    "python.testing.pytestArgs": ["tests", "apps/api/tests", "-q"],
    "python.analysis.typeCheckingMode": "standard",
    "cursorpyright.analysis.typeCheckingMode": "standard",
    "[python]": {
        "editor.defaultFormatter": "charliermarsh.ruff",
        "editor.codeActionsOnSave": {"source.organizeImports": "explicit"},
    },
    "[typescript]": {"editor.defaultFormatter": "esbenp.prettier-vscode"},
    "[typescriptreact]": {"editor.defaultFormatter": "esbenp.prettier-vscode"},
    "[javascript]": {"editor.defaultFormatter": "esbenp.prettier-vscode"},
    "[javascriptreact]": {"editor.defaultFormatter": "esbenp.prettier-vscode"},
    "[json]": {"editor.defaultFormatter": "esbenp.prettier-vscode"},
    "editor.codeActionsOnSave": {"source.fixAll.eslint": "explicit"},
    "eslint.validate": [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact",
    ],
    "files.exclude": {
        "**/__pycache__": True,
        "**/.next": True,
        "**/node_modules": True,
        "**/.pytest_cache": True,
    },
    "files.watcherExclude": {
        "**/node_modules/**": True,
        "**/.next/**": True,
        "**/.venv/**": True,
        "**/dist/**": True,
    },
    "search.exclude": {
        "**/node_modules": True,
        "**/.next": True,
        "**/pnpm-lock.yaml": True,
    },
}


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    ext_payload = [
        {"identifier": {"id": eid}, "preRelease": False} for eid in EXTENSIONS
    ]
    profile = {
        "name": "Web-Oshi",
        "settings": json.dumps(SETTINGS, ensure_ascii=False),
        "extensions": json.dumps(ext_payload, ensure_ascii=False),
    }
    OUT.write_text(
        json.dumps(profile, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
