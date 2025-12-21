import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict

PROJECT_ROOT = str(Path(__file__).resolve().parents[1])
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from services.supabase_health import check_supabase_health


def _print_human(report: Dict[str, Any]) -> None:
    env = report.get("env") or {}
    client = report.get("client") or {}
    db = report.get("db") or {}
    storage = report.get("storage") or {}

    print("== Supabase Health Check ==")
    print(f"SUPABASE_URL_set: {env.get('SUPABASE_URL_set')}")
    print(
        f"SUPABASE_KEY_set: {env.get('SUPABASE_KEY_set')} ({env.get('SUPABASE_KEY_masked')})"
    )
    print(f"client.ok: {client.get('ok')}")
    if client.get("error"):
        print(f"client.error: {client.get('error')}")

    def show_block(name: str, block: Dict[str, Any]) -> None:
        ok = block.get("ok")
        print(f"\n-- {name} --")
        print(f"ok: {ok}")
        if ok:
            for k, v in block.items():
                if k == "ok":
                    continue
                print(f"{k}: {v}")
        else:
            print(f"error: {block.get('error')}")

    for k in [
        "theme_settings_select",
        "registration_product_information_select",
        "photo_select",
        "theme_settings_write_test",
    ]:
        if k in db:
            show_block(f"db.{k}", db[k])

    for k in ["list_buckets", "photos_list"]:
        if k in storage:
            show_block(f"storage.{k}", storage[k])

    print("\n== How to interpret ==")
    print(
        "- db.*.ok=False and error contains 'permission denied' -> likely RLS/policy issue"
    )
    print("- db.*.ok=True and rows=0 -> permission OK, but there is no data")
    print("- storage.photos_list.ok=False -> likely Storage policy/bucket/key issue")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Supabase connection/permission health check"
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="DB write test (safe row in theme_settings)",
    )
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    report = check_supabase_health(write=args.write)

    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        _print_human(report)

    return 0 if report.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
