"""Tag management service for color tags, category tags, and receipt location tags."""

import re
from typing import Dict, List, Any, Optional
from services.supabase_client import get_supabase_client

try:
    from flask import g, has_app_context
except Exception:  # pragma: no cover
    g = None
    has_app_context = lambda: False  # type: ignore


def _current_members_id() -> Optional[str]:
    if g is None or not has_app_context():
        return None
    uid = getattr(g, "user_id", None)
    return str(uid) if uid else None


# 初期7色（slot固定）
DEFAULT_COLOR_TAGS: List[Dict[str, Any]] = [
    {"slot": 1, "color_tag_name": "赤", "color_tag_color": "#dc3545"},
    {"slot": 2, "color_tag_name": "青", "color_tag_color": "#0d6efd"},
    {"slot": 3, "color_tag_name": "緑", "color_tag_color": "#198754"},
    {"slot": 4, "color_tag_name": "黄", "color_tag_color": "#ffc107"},
    {"slot": 5, "color_tag_name": "紫", "color_tag_color": "#6f42c1"},
    {"slot": 6, "color_tag_name": "黒", "color_tag_color": "#212529"},
    {"slot": 7, "color_tag_name": "白", "color_tag_color": "#f8f9fa"},
]

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")

# Bootstrap Icons クラス名（収納場所アイコン用・自由入力のホワイトリスト）
BOOTSTRAP_ICON_RE = re.compile(r"^bi-[a-z0-9-]{1,64}$")

RECEIPT_LOCATION_NAME_MAX_LEN = 200
CATEGORY_TAG_NAME_MAX_LEN = 200

# プリセット収納場所の slot 範囲（この範囲の行を削除したら再作成しない）
PRESET_RECEIPT_LOCATION_SLOT_MIN = 1
PRESET_RECEIPT_LOCATION_SLOT_MAX = 6

# プリセットカテゴリの slot 範囲（収納場所と同様 1..6）
PRESET_CATEGORY_SLOT_MIN = 1
PRESET_CATEGORY_SLOT_MAX = 6

# プリセット6件（slot 1..6）。不足分のみ insert し、既存行は上書きしない。
DEFAULT_RECEIPT_LOCATIONS: List[Dict[str, Any]] = [
    {"slot": 1, "receipt_location_name": "タンス", "receipt_location_icon": "bi-archive"},
    {"slot": 2, "receipt_location_name": "書棚", "receipt_location_icon": "bi-bookshelf"},
    {"slot": 3, "receipt_location_name": "段ボール", "receipt_location_icon": "bi-box"},
    {"slot": 4, "receipt_location_name": "フォルダ", "receipt_location_icon": "bi-folder"},
    {"slot": 5, "receipt_location_name": "クリアファイル", "receipt_location_icon": "bi-file-earmark"},
    {"slot": 6, "receipt_location_name": "ディスプレイ", "receipt_location_icon": "bi-tv"},
]

# プリセット6件（slot 1..6）。不足分のみ insert。既存行は上書きしない。
DEFAULT_CATEGORY_TAGS: List[Dict[str, Any]] = [
    {"slot": 1, "category_tag_name": "本", "category_tag_color": "#0d6efd", "category_tag_icon": "bi-book"},
    {"slot": 2, "category_tag_name": "キーホルダー", "category_tag_color": "#fd7e14", "category_tag_icon": "bi-key"},
    {"slot": 3, "category_tag_name": "家庭用", "category_tag_color": "#198754", "category_tag_icon": "bi-house-door"},
    {"slot": 4, "category_tag_name": "仕事用", "category_tag_color": "#6f42c1", "category_tag_icon": "bi-briefcase"},
    {"slot": 5, "category_tag_name": "缶バッジ", "category_tag_color": "#20c997", "category_tag_icon": "bi-circle"},
    {"slot": 6, "category_tag_name": "フィギュア", "category_tag_color": "#dc3545", "category_tag_icon": "bi-robot"},
]


def normalize_receipt_location_icon(raw: Optional[str]) -> Optional[str]:
    """有効な Bootstrap Icons クラス名ならそのまま返す。無効なら None。"""
    s = (raw or "").strip()
    if not s:
        return None
    if not BOOTSTRAP_ICON_RE.match(s):
        return None
    return s


def normalize_receipt_location_name(raw: Optional[str]) -> Optional[str]:
    """収納場所名を検証。空・超過なら None。"""
    name = (raw or "").strip()
    if not name:
        return None
    if len(name) > RECEIPT_LOCATION_NAME_MAX_LEN:
        return None
    return name


def normalize_category_icon(raw: Optional[str]) -> Optional[str]:
    """カテゴリアイコンは収納場所と同じ bi-* 形式。"""
    return normalize_receipt_location_icon(raw)


def normalize_category_name(raw: Optional[str]) -> Optional[str]:
    """カテゴリ名を検証。空・超過なら None。"""
    name = (raw or "").strip()
    if not name:
        return None
    if len(name) > CATEGORY_TAG_NAME_MAX_LEN:
        return None
    return name


def normalize_category_color(raw: Optional[str]) -> Optional[str]:
    """#RRGGBB のみ有効。"""
    c = (raw or "").strip()
    if not c:
        return None
    if not HEX_RE.match(c):
        return None
    return c


def _validate_color_tag_entries(entries: List[Dict[str, Any]]) -> bool:
    if len(entries) != 7:
        return False
    for e in entries:
        if not isinstance(e, dict):
            return False
        if not (1 <= int(e.get("slot", 0)) <= 7):
            return False
        name = (e.get("color_tag_name") or "").strip()
        color = e.get("color_tag_color") or ""
        if not name:
            return False
        if not HEX_RE.match(color):
            return False
    return True


def ensure_default_color_tags() -> List[Dict[str, Any]]:
    """足りない slot に初期7色を投入し、slot順で返す。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return []
    try:
        # 既存を取得
        resp = (
            supabase.table("color_tag")
            .select("*")
            .eq("members_id", members_id)
            .order("slot")
            .execute()
        )
        existing = resp.data or []
        filled_slots = {int(item.get("slot")) for item in existing if item.get("slot")}
        # 足りないslotだけ insert
        missing_payload = [
            dict(dc, members_id=members_id)
            for dc in DEFAULT_COLOR_TAGS
            if dc["slot"] not in filled_slots
        ]
        if missing_payload:
            supabase.table("color_tag").upsert(
                missing_payload, on_conflict="members_id,slot"
            ).execute()
            # 再取得
            resp = (
                supabase.table("color_tag")
                .select("*")
                .eq("members_id", members_id)
                .order("slot")
                .execute()
            )
            return resp.data or []
        return existing
    except Exception:
        return []


def save_color_tags(entries: List[Dict[str, Any]]) -> bool:
    """7件まとめて保存（slot=1..7）。"""
    if not _validate_color_tag_entries(entries):
        return False
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False
    payload = []
    for e in entries:
        payload.append(
            {
                "members_id": members_id,
                "slot": int(e["slot"]),
                "color_tag_name": (e.get("color_tag_name") or "").strip(),
                "color_tag_color": e.get("color_tag_color"),
            }
        )
    try:
        supabase.table("color_tag").upsert(
            payload, on_conflict="members_id,slot"
        ).execute()
        return True
    except Exception:
        return False


def get_color_tags_ordered() -> List[Dict[str, Any]]:
    """slot順で取得。足りない場合は初期化してから返す。"""
    ensured = ensure_default_color_tags()
    # ensureで失敗した場合はそのまま返る（空or部分的）
    return sorted(
        ensured, key=lambda x: int(x.get("slot") or 0)
    )


def get_color_tags() -> List[Dict[str, Any]]:
    """Get all color tags."""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return []

    try:
        response = (
            supabase.table("color_tag")
            .select("*")
            .eq("members_id", members_id)
            .execute()
        )
        return response.data if response.data else []
    except Exception:
        return []


def _get_dismissed_preset_slots() -> set[int]:
    """ユーザーが削除したプリセット slot（1..6）。テーブル未作成時は空扱い。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return set()
    try:
        resp = (
            supabase.table("receipt_location_preset_slot_dismissed")
            .select("slot")
            .eq("members_id", members_id)
            .execute()
        )
        out: set[int] = set()
        for row in resp.data or []:
            s = row.get("slot")
            if s is None:
                continue
            try:
                out.add(int(s))
            except (TypeError, ValueError):
                continue
        return out
    except Exception:
        return set()


def _get_dismissed_category_preset_slots() -> set[int]:
    """ユーザーが削除したカテゴリプリセット slot（1..6）。テーブル未作成時は空扱い。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return set()
    try:
        resp = (
            supabase.table("category_tag_preset_slot_dismissed")
            .select("slot")
            .eq("members_id", members_id)
            .execute()
        )
        out: set[int] = set()
        for row in resp.data or []:
            s = row.get("slot")
            if s is None:
                continue
            try:
                out.add(int(s))
            except (TypeError, ValueError):
                continue
        return out
    except Exception:
        return set()


def ensure_default_receipt_locations() -> List[Dict[str, Any]]:
    """slot 1..6 の欠けのみ insert。ユーザーが削除済みの slot は再作成しない。既存行は上書きしない。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return []
    try:
        resp = (
            supabase.table("receipt_location")
            .select("*")
            .eq("members_id", members_id)
            .execute()
        )
        existing = resp.data or []
        filled_slots: set[int] = set()
        for item in existing:
            s = item.get("slot")
            if s is None:
                continue
            try:
                filled_slots.add(int(s))
            except (TypeError, ValueError):
                continue
        dismissed = _get_dismissed_preset_slots()
        missing = [
            {
                "members_id": members_id,
                "slot": int(dc["slot"]),
                "display_order": int(dc["slot"]) * 10,
                "receipt_location_name": dc["receipt_location_name"],
                "receipt_location_icon": dc["receipt_location_icon"],
                "receipt_location_use_flag": 1,
            }
            for dc in DEFAULT_RECEIPT_LOCATIONS
            if int(dc["slot"]) not in filled_slots
            and int(dc["slot"]) not in dismissed
        ]
        if missing:
            supabase.table("receipt_location").insert(missing).execute()
            resp = (
                supabase.table("receipt_location")
                .select("*")
                .eq("members_id", members_id)
                .execute()
            )
            return resp.data or []
        return existing
    except Exception:
        return []


def get_receipt_location_tags_ordered() -> List[Dict[str, Any]]:
    """display_order 昇順（同値は receipt_location_id）。"""
    ensured = ensure_default_receipt_locations()
    return sorted(
        ensured,
        key=lambda x: (
            int(x.get("display_order") or 0),
            int(x.get("receipt_location_id") or 0),
        ),
    )


def ensure_default_category_tags() -> List[Dict[str, Any]]:
    """slot 1..6 の欠けのみ insert。ユーザーが削除済みの slot は再作成しない。既存行は上書きしない。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return []
    try:
        resp = (
            supabase.table("category_tag")
            .select("*")
            .eq("members_id", members_id)
            .execute()
        )
        existing = resp.data or []
        filled_slots: set[int] = set()
        for item in existing:
            s = item.get("slot")
            if s is None:
                continue
            try:
                filled_slots.add(int(s))
            except (TypeError, ValueError):
                continue
        dismissed = _get_dismissed_category_preset_slots()
        missing = [
            {
                "members_id": members_id,
                "slot": int(dc["slot"]),
                "display_order": int(dc["slot"]) * 10,
                "category_tag_name": dc["category_tag_name"],
                "category_tag_color": dc["category_tag_color"],
                "category_tag_icon": dc["category_tag_icon"],
                "category_tag_use_flag": 1,
            }
            for dc in DEFAULT_CATEGORY_TAGS
            if int(dc["slot"]) not in filled_slots
            and int(dc["slot"]) not in dismissed
        ]
        if missing:
            supabase.table("category_tag").insert(missing).execute()
            resp = (
                supabase.table("category_tag")
                .select("*")
                .eq("members_id", members_id)
                .execute()
            )
            return resp.data or []
        return existing
    except Exception:
        return []


def get_category_tags_ordered() -> List[Dict[str, Any]]:
    """display_order 昇順（同値は category_tag_id）。"""
    ensured = ensure_default_category_tags()
    return sorted(
        ensured,
        key=lambda x: (
            int(x.get("display_order") or 0),
            int(x.get("category_tag_id") or 0),
        ),
    )


def get_category_tags() -> List[Dict[str, Any]]:
    """現在ユーザーのカテゴリタグ（プリセット＋追加行、表示順）。"""
    return get_category_tags_ordered()


def _max_display_order_for_member() -> int:
    """現在ユーザーの receipt_location の最大 display_order。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return 0
    try:
        resp = (
            supabase.table("receipt_location")
            .select("display_order")
            .eq("members_id", members_id)
            .order("display_order", desc=True)
            .limit(1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            return 0
        return int(rows[0].get("display_order") or 0)
    except Exception:
        return 0


def delete_receipt_location_tag(receipt_location_id: int) -> bool:
    """収納場所タグを削除（本人行のみ）。参照商品の receipt_location_id は SET NULL。
    slot 1..6 のプリセット行を消した場合は記録し、以後 ensure で同 slot を再作成しない。
    """
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False
    try:
        rid = int(receipt_location_id)
    except (TypeError, ValueError):
        return False
    try:
        sel = (
            supabase.table("receipt_location")
            .select("slot")
            .eq("receipt_location_id", rid)
            .eq("members_id", members_id)
            .limit(1)
            .execute()
        )
        row = (sel.data or [None])[0]
        if row is not None:
            s = row.get("slot")
            if s is not None:
                try:
                    slot = int(s)
                except (TypeError, ValueError):
                    slot = None
                if (
                    slot is not None
                    and PRESET_RECEIPT_LOCATION_SLOT_MIN
                    <= slot
                    <= PRESET_RECEIPT_LOCATION_SLOT_MAX
                ):
                    try:
                        supabase.table("receipt_location_preset_slot_dismissed").upsert(
                            [{"members_id": members_id, "slot": slot}],
                            on_conflict="members_id,slot",
                        ).execute()
                    except Exception:
                        # マイグレーション未適用時は削除のみ続行（従来どおり欠けが埋まる可能性あり）
                        pass
        supabase.table("receipt_location").delete().eq(
            "receipt_location_id", rid
        ).eq("members_id", members_id).execute()
        return True
    except Exception:
        return False


def _receipt_row_id(row: Dict[str, Any]) -> Optional[int]:
    """receipt_location_id を整数化（JSON 経由の float 等も吸収）。"""
    v = row.get("receipt_location_id")
    if v is None:
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        try:
            return int(float(v))
        except (TypeError, ValueError):
            return None


def move_receipt_location_tag(receipt_location_id: int, direction: str) -> bool:
    """隣行と display_order を入れ替える（up / down）。
    display_order が重複している場合は先に 10 刻みで正規化してから入れ替える。
    """
    if direction not in ("up", "down"):
        return False
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False
    try:
        target_id = int(receipt_location_id)
    except (TypeError, ValueError):
        return False

    def _fetch_sorted() -> List[Dict[str, Any]]:
        resp = (
            supabase.table("receipt_location")
            .select("*")
            .eq("members_id", members_id)
            .execute()
        )
        return sorted(
            resp.data or [],
            key=lambda x: (
                int(x.get("display_order") or 0),
                _receipt_row_id(x) or 0,
            ),
        )

    try:
        rows = _fetch_sorted()
        if not rows:
            return False

        orders = [int(x.get("display_order") or 0) for x in rows]
        if len(set(orders)) < len(rows):
            for i, r in enumerate(rows):
                rid = _receipt_row_id(r)
                if rid is None:
                    return False
                supabase.table("receipt_location").update(
                    {"display_order": (i + 1) * 10}
                ).eq("receipt_location_id", rid).eq("members_id", members_id).execute()
            rows = _fetch_sorted()

        idx = next(
            (
                i
                for i, r in enumerate(rows)
                if _receipt_row_id(r) == target_id
            ),
            None,
        )
        if idx is None:
            return False
        j = idx - 1 if direction == "up" else idx + 1
        if j < 0 or j >= len(rows):
            return False
        a, b = rows[idx], rows[j]
        id_a = _receipt_row_id(a)
        id_b = _receipt_row_id(b)
        if id_a is None or id_b is None:
            return False
        oa = int(a.get("display_order") or 0)
        ob = int(b.get("display_order") or 0)
        supabase.table("receipt_location").update({"display_order": ob}).eq(
            "receipt_location_id", id_a
        ).eq("members_id", members_id).execute()
        supabase.table("receipt_location").update({"display_order": oa}).eq(
            "receipt_location_id", id_b
        ).eq("members_id", members_id).execute()
        return True
    except Exception:
        return False


def get_receipt_location_tags() -> List[Dict[str, Any]]:
    """現在ユーザーの収納場所タグ（プリセット順＋追加行）。"""
    return get_receipt_location_tags_ordered()


def _max_display_order_for_category_member() -> int:
    """現在ユーザーの category_tag の最大 display_order。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return 0
    try:
        resp = (
            supabase.table("category_tag")
            .select("display_order")
            .eq("members_id", members_id)
            .order("display_order", desc=True)
            .limit(1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            return 0
        return int(rows[0].get("display_order") or 0)
    except Exception:
        return 0


def _category_row_id(row: Dict[str, Any]) -> Optional[int]:
    """category_tag_id を整数化（JSON 経由の float 等も吸収）。"""
    v = row.get("category_tag_id")
    if v is None:
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        try:
            return int(float(v))
        except (TypeError, ValueError):
            return None


def delete_category_tag(category_tag_id: int) -> bool:
    """カテゴリタグを削除（本人行のみ）。参照商品の category_tag_id は SET NULL。
    slot 1..6 のプリセット行を消した場合は記録し、以後 ensure で同 slot を再作成しない。
    """
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False
    try:
        cid = int(category_tag_id)
    except (TypeError, ValueError):
        return False
    try:
        sel = (
            supabase.table("category_tag")
            .select("slot")
            .eq("category_tag_id", cid)
            .eq("members_id", members_id)
            .limit(1)
            .execute()
        )
        row = (sel.data or [None])[0]
        if row is not None:
            s = row.get("slot")
            if s is not None:
                try:
                    slot = int(s)
                except (TypeError, ValueError):
                    slot = None
                if (
                    slot is not None
                    and PRESET_CATEGORY_SLOT_MIN <= slot <= PRESET_CATEGORY_SLOT_MAX
                ):
                    try:
                        supabase.table(
                            "category_tag_preset_slot_dismissed"
                        ).upsert(
                            [{"members_id": members_id, "slot": slot}],
                            on_conflict="members_id,slot",
                        ).execute()
                    except Exception:
                        pass
        supabase.table("category_tag").delete().eq(
            "category_tag_id", cid
        ).eq("members_id", members_id).execute()
        return True
    except Exception:
        return False


def move_category_tag(category_tag_id: int, direction: str) -> bool:
    """隣行と display_order を入れ替える（up / down）。"""
    if direction not in ("up", "down"):
        return False
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False
    try:
        target_id = int(category_tag_id)
    except (TypeError, ValueError):
        return False

    def _fetch_sorted() -> List[Dict[str, Any]]:
        resp = (
            supabase.table("category_tag")
            .select("*")
            .eq("members_id", members_id)
            .execute()
        )
        return sorted(
            resp.data or [],
            key=lambda x: (
                int(x.get("display_order") or 0),
                _category_row_id(x) or 0,
            ),
        )

    try:
        rows = _fetch_sorted()
        if not rows:
            return False

        orders = [int(x.get("display_order") or 0) for x in rows]
        if len(set(orders)) < len(rows):
            for i, r in enumerate(rows):
                rid = _category_row_id(r)
                if rid is None:
                    return False
                supabase.table("category_tag").update(
                    {"display_order": (i + 1) * 10}
                ).eq("category_tag_id", rid).eq("members_id", members_id).execute()
            rows = _fetch_sorted()

        idx = next(
            (i for i, r in enumerate(rows) if _category_row_id(r) == target_id),
            None,
        )
        if idx is None:
            return False
        j = idx - 1 if direction == "up" else idx + 1
        if j < 0 or j >= len(rows):
            return False
        a, b = rows[idx], rows[j]
        id_a = _category_row_id(a)
        id_b = _category_row_id(b)
        if id_a is None or id_b is None:
            return False
        oa = int(a.get("display_order") or 0)
        ob = int(b.get("display_order") or 0)
        supabase.table("category_tag").update({"display_order": ob}).eq(
            "category_tag_id", id_a
        ).eq("members_id", members_id).execute()
        supabase.table("category_tag").update({"display_order": oa}).eq(
            "category_tag_id", id_b
        ).eq("members_id", members_id).execute()
        return True
    except Exception:
        return False


def update_color_tag(color_tag_id: int, name: str, color: str) -> bool:
    """Update a color tag."""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False

    try:
        supabase.table("color_tag").update(
            {"color_tag_name": name, "color_tag_color": color}
        ).eq("color_tag_id", color_tag_id).eq("members_id", members_id).execute()
        return True
    except Exception:
        return False


def update_category_tag(category_tag_id: int, name: str, color: str, icon: str) -> bool:
    """カテゴリタグを更新（本人行のみ）。名称・色・アイコンを検証する。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False
    n = normalize_category_name(name)
    col = normalize_category_color(color)
    ic = normalize_category_icon(icon)
    if n is None or col is None or ic is None:
        return False
    try:
        supabase.table("category_tag").update(
            {
                "category_tag_name": n,
                "category_tag_color": col,
                "category_tag_icon": ic,
            }
        ).eq("category_tag_id", category_tag_id).eq("members_id", members_id).execute()
        return True
    except Exception:
        return False


def update_receipt_location_tag(receipt_location_id: int, name: str, icon: str) -> bool:
    """収納場所タグを更新（本人行のみ）。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False
    n = normalize_receipt_location_name(name)
    ic = normalize_receipt_location_icon(icon)
    if n is None or ic is None:
        return False
    try:
        supabase.table("receipt_location").update(
            {"receipt_location_name": n, "receipt_location_icon": ic}
        ).eq("receipt_location_id", receipt_location_id).eq(
            "members_id", members_id
        ).execute()
        return True
    except Exception:
        return False


def create_color_tag(name: str, color: str) -> bool:
    """Create a new color tag."""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False

    try:
        supabase.table("color_tag").insert(
            {"color_tag_name": name, "color_tag_color": color, "members_id": members_id}
        ).execute()
        return True
    except Exception:
        return False


def create_category_tag(name: str, color: str, icon: str) -> bool:
    """追加行としてカテゴリタグを作成（slot は NULL、件数上限なし）。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False
    n = normalize_category_name(name)
    col = normalize_category_color(color)
    ic = normalize_category_icon(icon)
    if n is None or col is None or ic is None:
        return False
    try:
        next_order = _max_display_order_for_category_member() + 10
        supabase.table("category_tag").insert(
            {
                "members_id": members_id,
                "slot": None,
                "display_order": next_order,
                "category_tag_name": n,
                "category_tag_color": col,
                "category_tag_icon": ic,
                "category_tag_use_flag": 1,
            }
        ).execute()
        return True
    except Exception:
        return False


def create_receipt_location_tag(name: str, icon: str) -> bool:
    """追加行として収納場所タグを作成（slot は NULL、件数上限なし）。"""
    supabase = get_supabase_client()
    members_id = _current_members_id()
    if not supabase or not members_id:
        return False
    n = normalize_receipt_location_name(name)
    ic = normalize_receipt_location_icon(icon)
    if n is None or ic is None:
        return False
    try:
        next_order = _max_display_order_for_member() + 10
        supabase.table("receipt_location").insert(
            {
                "members_id": members_id,
                "slot": None,
                "display_order": next_order,
                "receipt_location_name": n,
                "receipt_location_icon": ic,
                "receipt_location_use_flag": 1,
            }
        ).execute()
        return True
    except Exception:
        return False


def _update_tags(state: Dict[str, Any]) -> Dict[str, Any]:
    """Update tags based on lookup data and image description."""
    items = state["lookup"].get("items") or []
    description = state["front_photo"].get("description")
    description_status = state["front_photo"].get("description_status")
    description_len = len(description or "")

    print(
        f"DEBUG: _update_tags called - items: {len(items)}, description: {bool(description)}"
    )
    print(
        "DEBUG: _update_tags description_status="
        f"{description_status}, description_len={description_len}"
    )

    # 4つのパターンを適切に処理
    has_rakuten_data = bool(items)
    has_image_description = bool(description)

    print(
        f"DEBUG: has_rakuten_data: {has_rakuten_data}, has_image_description: {has_image_description}"
    )

    if not has_rakuten_data and not has_image_description:
        state["tags"] = {
            "status": "not_ready",
            "tags": [],
            "message": "バーコード照合または画像説明の結果が揃うとタグを生成します。",
        }
        return state["tags"]

    # IO Intelligence APIでタグを生成
    print("DEBUG: Calling extract_tags...")
    photo_content = state.get("front_photo", {}).get("content")
    from services.tag_extraction import extract_tags
    tag_result = extract_tags(items, description, photo_content)
    print(f"DEBUG: extract_tags result: {tag_result}")

    # タグ生成結果に応じてメッセージを調整（既にメッセージがあれば優先）
    if tag_result["status"] == "success" and not tag_result.get("message"):
        if has_rakuten_data and has_image_description:
            tag_result["message"] = (
                f"楽天API情報と画像説明から{len(tag_result['tags'])}個のタグを生成しました。"
            )
        elif has_rakuten_data:
            tag_result["message"] = (
                f"楽天API情報から{len(tag_result['tags'])}個のタグを生成しました。"
            )
        elif has_image_description:
            tag_result["message"] = (
                f"画像説明から{len(tag_result['tags'])}個のタグを生成しました。"
            )

    state["tags"] = tag_result
    return tag_result