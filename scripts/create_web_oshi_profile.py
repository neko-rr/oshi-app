# -*- coding: utf-8 -*-
"""Create Cursor profile Web-Oshi for Next.js + FastAPI TDD workspaces."""
from __future__ import annotations

import hashlib
import json
import os
import shutil
from pathlib import Path

EXT_ROOT = Path(os.path.expanduser(r"~\.cursor\extensions"))
APPDATA = Path(os.environ["APPDATA"]) / "Cursor" / "User"
STORAGE = APPDATA / "globalStorage" / "storage.json"
PROFILES = APPDATA / "profiles"

WANT = [
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
    "bierner.markdown-mermaid",
    "ms-ceintl.vscode-language-pack-ja",
    "ms-azuretools.vscode-docker",
    "ms-azuretools.vscode-containers",
]


def iter_ext_dirs():
    if not EXT_ROOT.is_dir():
        return
    for d in EXT_ROOT.iterdir():
        if d.is_dir() and (d / "package.json").is_file():
            yield d


def find_ext(want_id: str) -> dict | None:
    want_l = want_id.lower()
    best = None
    for d in iter_ext_dirs():
        name_l = d.name.lower()
        if not (name_l.startswith(want_l + "-") or name_l == want_l):
            continue
        try:
            meta = json.loads((d / "package.json").read_text(encoding="utf-8"))
        except OSError:
            continue
        version = meta.get("version", "0.0.0")
        if best is None or version > best["version"]:
            best = {"id": want_id, "version": version, "dir": d}
    return best


def path_posix(p: Path) -> str:
    win = str(p.resolve()).replace("\\", "/")
    if len(win) >= 2 and win[1] == ":":
        return f"/{win[0].lower()}:{win[2:]}"
    return win


def main() -> None:
    missing: list[str] = []
    entries: list[dict] = []
    for wid in WANT:
        ext = find_ext(wid)
        if not ext:
            missing.append(wid)
            continue
        d: Path = ext["dir"]
        entries.append(
            {
                "identifier": {"id": wid},
                "version": ext["version"],
                "location": {
                    "$mid": 1,
                    "path": path_posix(d),
                    "scheme": "file",
                },
                "relativeLocation": d.name,
                "metadata": {
                    "installedTimestamp": int(d.stat().st_mtime * 1000),
                    "source": "gallery",
                    "pinned": False,
                    "isPreReleaseVersion": False,
                    "hasPreReleaseVersion": False,
                    "updated": False,
                    "private": False,
                },
            }
        )

    hid = hashlib.sha1(b"oshi-web-v1").hexdigest()[:8]
    loc = f"-{hid}"
    while (PROFILES / loc).exists():
        hid = hashlib.sha1(hid.encode()).hexdigest()[:8]
        loc = f"-{hid}"

    prof_dir = PROFILES / loc
    prof_dir.mkdir(parents=True, exist_ok=True)
    (prof_dir / "globalStorage").mkdir(exist_ok=True)
    (prof_dir / "snippets").mkdir(exist_ok=True)

    settings = {
        "editor.formatOnSave": True,
        "files.autoSave": "afterDelay",
        "workbench.iconTheme": "vscode-icons",
        "git.autofetch": True,
        "github.copilot.enable": {
            "*": False,
            "plaintext": False,
            "markdown": False,
            "scminput": False,
            "code-text-binary": False,
        },
        "python.testing.pytestEnabled": True,
        "python.testing.unittestEnabled": False,
        "python.testing.pytestArgs": ["tests", "-q"],
        "python.analysis.typeCheckingMode": "standard",
        "cursorpyright.analysis.typeCheckingMode": "standard",
        "[python]": {
            "editor.defaultFormatter": "charliermarsh.ruff",
            "editor.codeActionsOnSave": {
                "source.organizeImports": "explicit"
            },
        },
        "[typescript]": {"editor.defaultFormatter": "esbenp.prettier-vscode"},
        "[typescriptreact]": {"editor.defaultFormatter": "esbenp.prettier-vscode"},
        "[javascript]": {"editor.defaultFormatter": "esbenp.prettier-vscode"},
        "[javascriptreact]": {"editor.defaultFormatter": "esbenp.prettier-vscode"},
        "[json]": {"editor.defaultFormatter": "esbenp.prettier-vscode"},
        "editor.codeActionsOnSave": {
            "source.fixAll.eslint": "explicit"
        },
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

    (prof_dir / "extensions.json").write_text(
        json.dumps(entries, ensure_ascii=False),
        encoding="utf-8",
    )
    (prof_dir / "settings.json").write_text(
        json.dumps(settings, ensure_ascii=False, indent=4) + "\n",
        encoding="utf-8",
    )

    backup = STORAGE.with_suffix(".json.bak-before-web-profile")
    shutil.copy2(STORAGE, backup)
    data = json.loads(STORAGE.read_text(encoding="utf-8"))
    profiles = [p for p in (data.get("userDataProfiles") or []) if p.get("name") != "Web-Oshi"]
    profiles.append({"location": loc, "name": "Web-Oshi"})
    data["userDataProfiles"] = profiles

    assoc = data.get("profileAssociations") or {"workspaces": {}, "emptyWindows": {}}
    ws = assoc.setdefault("workspaces", {})
    # マシン固有の絶対パスはソースに書かず、実行時のリポジトリ位置から作る
    repo = Path(__file__).resolve().parents[1]
    uris = [repo.resolve().as_uri()]
    for name in ("oshi-app", "oshi_app"):
        alt = (repo.parent / name).resolve()
        if alt.is_dir() and alt != repo.resolve():
            uris.append(alt.as_uri())
    for k in uris:
        ws[k] = loc
    data["profileAssociations"] = assoc
    STORAGE.write_text(json.dumps(data, ensure_ascii=False, indent=4), encoding="utf-8")

    # report path for docs
    report = {
        "name": "Web-Oshi",
        "location": loc,
        "path": str(prof_dir),
        "extensions": [e["identifier"]["id"] for e in entries],
        "missing": missing,
        "backup": str(backup),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
