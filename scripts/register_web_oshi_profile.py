# -*- coding: utf-8 -*-
"""Web-Oshi プロファイルを Cursor に正式登録する。

重要:
  Cursor のプロセスが起動中だと、storage.json の変更は UI に反映されず
  終了時に上書きされて消える。先に Cursor を完全終了してから実行する。

手順の優先順位:
  A) このスクリプト（Cursor 終了中）
  B) UI: Profiles → Import Profile → Web-Oshi.code-profile
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

PROFILE_NAME = "Web-Oshi"
# Kaggle と同様の短い location（既存手動作成フォルダを再利用）
LOCATION = "-fdd6b996"
OSHI_URI = "file:///c%3A/Users/ryone/Desktop/oshi_app"
OSHI_URI2 = "file:///c%3A/Users/ryone/Desktop/oshi-app"

APPDATA = Path(os.environ["APPDATA"]) / "Cursor" / "User"
STORAGE = APPDATA / "globalStorage" / "storage.json"
USER_STORAGE = APPDATA / "storage.json"
PROF_DIR = APPDATA / "profiles" / LOCATION
REPO = Path(__file__).resolve().parents[1]
CODE_PROFILE = REPO / ".vscode" / "profiles" / "Web-Oshi.code-profile"


def cursor_running() -> bool:
    try:
        out = subprocess.run(
            ["tasklist", "/FI", "IMAGENAME eq Cursor.exe"],
            capture_output=True,
            text=True,
            check=False,
        )
        return "Cursor.exe" in (out.stdout or "")
    except OSError:
        return False


def ensure_profile_files() -> None:
    if not CODE_PROFILE.is_file():
        subprocess.run(
            [sys.executable, str(REPO / "scripts" / "build_web_oshi_code_profile.py")],
            check=True,
            cwd=str(REPO),
        )
    data = json.loads(CODE_PROFILE.read_text(encoding="utf-8"))
    settings = json.loads(data["settings"])
    extensions = json.loads(data["extensions"])

    PROF_DIR.mkdir(parents=True, exist_ok=True)
    (PROF_DIR / "globalStorage").mkdir(exist_ok=True)
    (PROF_DIR / "snippets").mkdir(exist_ok=True)
    (PROF_DIR / "settings.json").write_text(
        json.dumps(settings, ensure_ascii=False, indent=4) + "\n",
        encoding="utf-8",
    )

    # インストール済み拡張へリンク（Kaggle プロファイルと同型）
    ext_root = Path(os.path.expanduser(r"~\.cursor\extensions"))
    installed: list[dict] = []
    for item in extensions:
        eid = item["identifier"]["id"]
        best = None
        best_ver = ""
        for d in ext_root.iterdir():
            if not d.is_dir() or not d.name.lower().startswith(eid.lower() + "-"):
                continue
            pkg = d / "package.json"
            if not pkg.is_file():
                continue
            meta = json.loads(pkg.read_text(encoding="utf-8"))
            ver = meta.get("version", "0")
            if best is None or ver > best_ver:
                best = d
                best_ver = ver
        if not best:
            continue
        win = str(best.resolve()).replace("\\", "/")
        path = f"/{win[0].lower()}:{win[2:]}" if len(win) > 2 and win[1] == ":" else win
        installed.append(
            {
                "identifier": {"id": eid},
                "version": best_ver,
                "location": {"$mid": 1, "path": path, "scheme": "file"},
                "relativeLocation": best.name,
                "metadata": {
                    "installedTimestamp": int(best.stat().st_mtime * 1000),
                    "source": "gallery",
                    "pinned": False,
                    "isPreReleaseVersion": False,
                    "hasPreReleaseVersion": False,
                    "updated": False,
                    "private": False,
                },
            }
        )
    (PROF_DIR / "extensions.json").write_text(
        json.dumps(installed, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"profile files: {PROF_DIR} ({len(installed)} extensions linked)")


def register_in_storage() -> None:
    if not STORAGE.is_file():
        raise SystemExit(f"not found: {STORAGE}")
    bak = STORAGE.with_suffix(f".json.bak-web-oshi-{time.strftime('%Y%m%d%H%M%S')}")
    shutil.copy2(STORAGE, bak)
    print(f"backup: {bak}")

    data = json.loads(STORAGE.read_text(encoding="utf-8"))
    profiles = [
        p
        for p in (data.get("userDataProfiles") or [])
        if p.get("name") != PROFILE_NAME and p.get("location") != LOCATION
    ]
    profiles.append({"location": LOCATION, "name": PROFILE_NAME})
    data["userDataProfiles"] = profiles

    assoc = data.get("profileAssociations") or {"workspaces": {}, "emptyWindows": {}}
    ws = dict(assoc.get("workspaces") or {})
    ws[OSHI_URI] = LOCATION
    ws[OSHI_URI2] = LOCATION
    assoc["workspaces"] = ws
    data["profileAssociations"] = assoc
    STORAGE.write_text(json.dumps(data, ensure_ascii=False, indent=4), encoding="utf-8")

    if USER_STORAGE.is_file():
        ud = json.loads(USER_STORAGE.read_text(encoding="utf-8"))
        pa = ud.get("profileAssociations") or {"workspaces": {}, "emptyWindows": {}}
        pws = dict(pa.get("workspaces") or {})
        pws[OSHI_URI] = LOCATION
        pws[OSHI_URI2] = LOCATION
        pa["workspaces"] = pws
        ud["profileAssociations"] = pa
        USER_STORAGE.write_text(json.dumps(ud, ensure_ascii=False, indent=4), encoding="utf-8")

    print("registered:", profiles)
    print("oshi_app ->", LOCATION)


def main() -> int:
    ensure_profile_files()
    if cursor_running():
        print(
            "\n"
            "=== Cursor が起動中です ===\n"
            "この状態だと Web-Oshi を storage に書いても UI 一覧に出ず、\n"
            "終了時に消えることがあります。\n\n"
            "【推奨手順】\n"
            "1. Cursor をすべて終了（トレイ含む）\n"
            "2. もう一度: python scripts/register_web_oshi_profile.py\n"
            "3. Cursor を起動 → Profiles に Web-Oshi が出る\n"
            "   または oshi_app フォルダを開くと Web-Oshi が選ばれる\n\n"
            "【代替: UI から Import（起動したままで可）】\n"
            "1. Ctrl+Shift+P → 「Profiles: Import Profile」\n"
            "2. 次のファイルを選ぶ:\n"
            f"   {CODE_PROFILE}\n"
            "3. Import 後、Profiles: Switch Profile → Web-Oshi\n"
        )
        return 2
    register_in_storage()
    print("\nOK. Cursor を起動し、Profiles メニューで Web-Oshi を確認してください。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
