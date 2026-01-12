from typing import Any, Dict


def empty_registration_state() -> Dict[str, Any]:
    """初期状態の登録ストアを返す。"""
    return {
        "meta": {
            # 現在のフロー: goods_full / goods_quick / book（今は goods_full を既定に）
            "flow": "goods_full",
            # 直近の保存結果（バナー表示用）
            "last_save_message": None,
            "last_save_status": None,
        },
        "barcode": {
            "value": None,
            "type": None,
            "status": "idle",
            "source": None,
            "filename": None,
        },
        "front_photo": {
            "content": None,
            "filename": None,
            "content_type": None,
            "status": "idle",
            "description": None,
            "model_used": None,
            "description_status": "idle",
            "vision_source": None,
            "vision_raw": None,
            "structured_data": None,
            "original_tmp_path": None,
        },
        "lookup": {
            "status": "idle",
            "items": [],
            "message": "",
            "source": None,
            "keyword": None,
        },
        "tags": {
            "status": "idle",
            "tags": [],
            "message": "",
        },
        # 製品に付与するカラータグの slot (1..7) を保持
        "color_tags": {
            "selected_slots": [],
        },
    }


def ensure_state(data: Dict[str, Any]) -> Dict[str, Any]:
    """ストアの辞書を安全に補完した状態にして返す。"""
    state = empty_registration_state()
    if not isinstance(data, dict):
        return state

    meta = data.get("meta") or {}
    state["meta"].update(
        {
            "flow": meta.get("flow", state["meta"]["flow"]),
            "last_save_message": meta.get("last_save_message"),
            "last_save_status": meta.get("last_save_status"),
        }
    )

    barcode = data.get("barcode") or {}
    state["barcode"].update(
        {
            "value": barcode.get("value"),
            "type": barcode.get("type"),
            "status": barcode.get("status", state["barcode"]["status"]),
            "source": barcode.get("source"),
            "filename": barcode.get("filename"),
        }
    )

    front = data.get("front_photo") or {}
    state["front_photo"].update(
        {
            "content": front.get("content"),
            "filename": front.get("filename"),
            "content_type": front.get("content_type"),
            "status": front.get("status", state["front_photo"]["status"]),
            "description": front.get("description"),
            "model_used": front.get("model_used"),
            "description_status": front.get(
                "description_status", state["front_photo"]["description_status"]
            ),
            "vision_source": front.get("vision_source"),
            "vision_raw": front.get("vision_raw"),
            "structured_data": front.get("structured_data"),
            "original_tmp_path": front.get("original_tmp_path"),
        }
    )

    lookup = data.get("lookup") or {}
    state["lookup"].update(
        {
            "status": lookup.get("status", state["lookup"]["status"]),
            "items": lookup.get("items", []) or [],
            "message": lookup.get("message", ""),
            "source": lookup.get("source"),
            "keyword": lookup.get("keyword"),
        }
    )

    tags = data.get("tags") or {}
    state["tags"].update(
        {
            "status": tags.get("status", state["tags"]["status"]),
            "tags": tags.get("tags", []) or [],
            "message": tags.get("message", state["tags"]["message"]),
        }
    )

    color_tags = data.get("color_tags") or {}
    state["color_tags"].update(
        {
            "selected_slots": color_tags.get("selected_slots", [])
            or state["color_tags"]["selected_slots"],
        }
    )

    return state


def serialise_state(state: Dict[str, Any]) -> Dict[str, Any]:
    """状態をコピーして安全に返す（副作用防止）。"""
    return {
        "meta": {
            "flow": state["meta"].get("flow"),
            "last_save_message": state["meta"].get("last_save_message"),
            "last_save_status": state["meta"].get("last_save_status"),
        },
        "barcode": state["barcode"].copy(),
        "front_photo": state["front_photo"].copy(),
        "lookup": {
            "status": state["lookup"].get("status"),
            "items": [
                item.copy() if isinstance(item, dict) else item
                for item in state["lookup"].get("items", [])
            ],
            "message": state["lookup"].get("message"),
            "source": state["lookup"].get("source"),
            "keyword": state["lookup"].get("keyword"),
        },
        "tags": {
            "status": state["tags"].get("status"),
            "tags": list(state["tags"].get("tags", [])),
            "message": state["tags"].get("message"),
        },
        "color_tags": {
            "selected_slots": list(state["color_tags"].get("selected_slots", [])),
        },
    }
