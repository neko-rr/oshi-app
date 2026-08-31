# -*- coding: utf-8 -*-
import json
import os
import sqlite3
from pathlib import Path

user = Path(os.environ["APPDATA"]) / "Cursor" / "User"
print("profiles dirs:", [p.name for p in (user / "profiles").iterdir()] if (user / "profiles").exists() else None)

for name in ["globalStorage/storage.json", "storage.json"]:
    p = user / name
    d = json.loads(p.read_text(encoding="utf-8"))
    print("==", name, "==")
    for k in sorted(d.keys()):
        if "profile" in k.lower():
            v = d[k]
            s = json.dumps(v, ensure_ascii=False)
            print(k, ":", s[:800])

for p in user.rglob("state.vscdb"):
    print("DB", p)
    con = sqlite3.connect(str(p))
    cur = con.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cur.fetchall()]
    print(" tables", tables)
    for t in tables:
        try:
            cur.execute(f"SELECT key FROM {t} LIMIT 5")
            sample = cur.fetchall()
            print(t, "sample", sample[:3])
            cur.execute(
                f"SELECT key FROM {t} WHERE lower(key) LIKE '%profile%' OR lower(cast(value as text)) LIKE '%kaggle%' LIMIT 30"
            )
            rows = cur.fetchall()
            if rows:
                print(t, "keys", rows)
            cur.execute(
                f"SELECT key, value FROM {t} WHERE lower(cast(value as text)) LIKE '%userdataprofiles%' OR lower(cast(value as text)) LIKE '%kaggle-light%' LIMIT 10"
            )
            for k, v in cur.fetchall():
                print(" pair", k, str(v)[:300])
        except Exception as e:
            print(t, "err", e)
    con.close()
