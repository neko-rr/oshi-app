"""docs 配下の手メンテ／ARCHIVE ファイル先頭に更新区分コメントを付与する。"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "docs"

HAND = [
    "db/security.md",
    "db/naming.md",
    "db/wire-checklist.md",
    "db/storage.md",
    "db/backup-restore.md",
    "db/constraints-notes.md",
    "db/er-overview.md",
    "db/schema-catalog.md",
    "db/README.md",
    "product/value.md",
    "product/roadmap.md",
    "product/README.md",
    "product/meta/status_vocabulary.md",
    "product/meta/README.md",
    "product/acceptance/README.md",
    "product/acceptance/auth.md",
    "product/acceptance/register.md",
    "product/acceptance/gallery.md",
    "product/acceptance/product_detail.md",
    "product/acceptance/settings.md",
    "product/acceptance/dashboard.md",
    "product/flows/register.md",
    "WAKE_UP.md",
    "refs/official-links.md",
    "README.md",
]
ARCHIVE = [
    "archive/README.md",
    "archive/oauth-dash-flask.md",
]
MIGRATION = [
    "migration/v2/AGENTS.md",
    "migration/v2/glossary.md",
    "migration/v2/assist_external_apis.md",
    "migration/v2/cursor-profile-web-oshi.md",
    "migration/v2/rules/api_contract.md",
    "migration/v2/rules/auth.md",
    "migration/v2/rules/file_structure.md",
    "migration/v2/rules/naming.md",
    "migration/v2/rules/security.md",
    "migration/v2/skills/new-file-naming/SKILL.md",
    "migration/v2/skills/post-change-verify/SKILL.md",
    "migration/v2/skills/tdd-workflow/SKILL.md",
]
GENERATED_README = [
    "db/generated/README.md",
    "product/generated/README.md",
]

MARKERS = {
    "hand": "<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->\n",
    "archive": "<!-- 更新: ARCHIVE — 履歴のみ。新規設計の正にしない。凡例: docs/README.md -->\n",
    "migration": (
        "<!-- 更新: ARCHIVE寄り — 移行メモ。"
        "現行正本はルート AGENTS.md と .cursor/rules/*.mdc。凡例: docs/README.md -->\n"
    ),
    "generated_readme": (
        "<!-- 更新: 自動フォルダの説明 — "
        "中身の生成物は手編集禁止。凡例: docs/README.md -->\n"
    ),
}


def strip_existing_marker(text: str) -> str:
    lines = text.splitlines(True)
    if lines and lines[0].startswith("<!-- 更新:"):
        return "".join(lines[1:]).lstrip("\n")
    return text


def ensure(rel: str, kind: str) -> str:
    path = ROOT / rel
    if not path.is_file():
        # 別名候補を探す
        return f"MISSING {rel}"
    text = strip_existing_marker(path.read_text(encoding="utf-8"))
    path.write_text(MARKERS[kind] + text, encoding="utf-8")
    return f"OK {rel}"


def main() -> None:
    out: list[str] = []
    for rel in HAND:
        out.append(ensure(rel, "hand"))
    for rel in ARCHIVE:
        out.append(ensure(rel, "archive"))
    for rel in MIGRATION:
        out.append(ensure(rel, "migration"))
    for rel in GENERATED_README:
        out.append(ensure(rel, "generated_readme"))

    sql_candidates = [
        ROOT / "db" / "new-table-template.sql",
        ROOT / "db" / "new_table_template.sql",
    ]
    for sql in sql_candidates:
        if sql.is_file():
            t = sql.read_text(encoding="utf-8")
            lines = t.splitlines(True)
            if lines and lines[0].startswith("-- 更新:"):
                t = "".join(lines[1:]).lstrip("\n")
            banner = "-- 更新: 手 — 人が直すテンプレ。凡例: docs/README.md\n"
            sql.write_text(banner + t, encoding="utf-8")
            out.append(f"OK {sql.relative_to(ROOT).as_posix()}")
            break
    else:
        out.append("MISSING db/new-table-template.sql")

    print("\n".join(out))


if __name__ == "__main__":
    main()
