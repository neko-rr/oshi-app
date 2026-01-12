from typing import Dict, List, Optional

from supabase import Client

try:  # Flask が無い場合も安全に
    from flask import g, has_app_context
except Exception:  # pragma: no cover
    g = None


def _current_members_id() -> Optional[str]:
    if g is None or not has_app_context():
        return None
    uid = getattr(g, "user_id", None)
    return str(uid) if uid else None


def _validate_slots(slots: List[int]) -> List[int]:
    """1..7 のユニークな整数スロットだけにする（最大7件）。"""
    clean = []
    seen = set()
    for s in slots or []:
        try:
            si = int(s)
        except Exception:
            continue
        if 1 <= si <= 7 and si not in seen:
            clean.append(si)
            seen.add(si)
        if len(clean) >= 7:
            break
    return clean


def set_product_color_tags(
    supabase: Optional[Client],
    members_id: Optional[str],
    registration_product_id: Optional[int],
    slots: List[int],
) -> bool:
    """
    製品にカラータグ（slot）を複数付与する。
    - 既存を削除してから一括で insert
    - slots は 1..7 のユニークにクレンジング
    """
    if supabase is None or not registration_product_id:
        return False
    if not members_id:
        members_id = _current_members_id()
    if not members_id:
        return False

    clean_slots = _validate_slots(slots)
    try:
        # 既存削除
        supabase.table("registration_product_color_tag").delete().eq(
            "members_id", members_id
        ).eq("registration_product_id", registration_product_id).execute()

        if not clean_slots:
            return True  # 付与なしで終了

        payload = [
            {
                "members_id": members_id,
                "registration_product_id": registration_product_id,
                "slot": s,
            }
            for s in clean_slots
        ]
        supabase.table("registration_product_color_tag").insert(payload).execute()
        return True
    except Exception:
        return False


def get_product_color_tag_slots(
    supabase: Optional[Client],
    members_id: Optional[str],
    product_ids: List[int],
) -> Dict[int, List[int]]:
    """
    製品IDの配列に対して、付与された slot 一覧を返す。
    戻り値: {registration_product_id: [slot, ...]}
    """
    if supabase is None or not product_ids:
        return {}
    if not members_id:
        members_id = _current_members_id()
    if not members_id:
        return {}
    try:
        resp = (
            supabase.table("registration_product_color_tag")
            .select("registration_product_id, slot")
            .eq("members_id", members_id)
            .in_("registration_product_id", product_ids)
            .execute()
        )
        data = resp.data if hasattr(resp, "data") else []
        result: Dict[int, List[int]] = {}
        for row in data or []:
            pid = row.get("registration_product_id")
            slot = row.get("slot")
            if pid is None or slot is None:
                continue
            result.setdefault(int(pid), []).append(int(slot))
        # ソートして返す
        for k, v in result.items():
            result[k] = sorted(set(v))
        return result
    except Exception:
        return {}
