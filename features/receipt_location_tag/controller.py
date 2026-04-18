import uuid
from typing import Any, Dict, List, Optional

from dash import Input, Output, State, no_update, ALL, callback_context
from dash.exceptions import PreventUpdate

from features.receipt_location_tag.components import (
    build_receipt_location_row_blocks,
    _preview_icon,
)
from services.tag_service import (
    create_receipt_location_tag,
    delete_receipt_location_tag,
    get_receipt_location_tags_ordered,
    move_receipt_location_tag,
    normalize_receipt_location_icon,
    normalize_receipt_location_name,
    update_receipt_location_tag,
)


def _rid_key(row: Dict[str, Any]) -> Any:
    rid = row.get("receipt_location_id")
    if rid is not None:
        return rid
    return row.get("_key")


def _same_rid(a: Any, b: Any) -> bool:
    """dict id の rid（int / str）を比較する。"""
    return a == b or str(a) == str(b)


def _store_remove_row(rows: List[Dict[str, Any]], rid_key: Any) -> List[Dict[str, Any]]:
    return [r for r in rows if not _same_rid(_rid_key(r), rid_key)]


def _store_move_row(
    rows: List[Dict[str, Any]], rid_key: Any, direction: str
) -> Optional[List[Dict[str, Any]]]:
    rows = list(rows)
    idx = next(
        (i for i, r in enumerate(rows) if _same_rid(_rid_key(r), rid_key)),
        None,
    )
    if idx is None:
        return None
    j = idx - 1 if direction == "up" else idx + 1
    if j < 0 or j >= len(rows):
        return None
    rows[idx], rows[j] = rows[j], rows[idx]
    return rows


def _map_rid_values(values: Optional[List], ids: Optional[List]) -> Dict[Any, str]:
    out: Dict[Any, str] = {}
    for v, i in zip(values or [], ids or []):
        if not isinstance(i, dict):
            continue
        rid = i.get("rid")
        out[rid] = (v or "").strip()
    return out


def register_receipt_location_tag_callbacks(app):
    @app.callback(
        Output({"type": "rl-icon", "rid": ALL}, "value"),
        Output({"type": "rl-icon-preview", "rid": ALL}, "children"),
        Input({"type": "rl-icon-tile", "rid": ALL, "icon": ALL}, "n_clicks"),
        State({"type": "rl-icon", "rid": ALL}, "id"),
        State({"type": "rl-icon-preview", "rid": ALL}, "id"),
        prevent_initial_call=True,
    )
    def _pick_icon_tile(_n_clicks, icon_ids, preview_ids):
        tid = callback_context.triggered_id
        if not isinstance(tid, dict) or tid.get("type") != "rl-icon-tile":
            raise PreventUpdate
        target_rid = tid.get("rid")
        new_icon = (tid.get("icon") or "").strip()
        if not new_icon:
            raise PreventUpdate
        ids_icon = list(icon_ids or [])
        ids_prev = list(preview_ids or [])
        if len(ids_icon) != len(ids_prev):
            raise PreventUpdate
        out_vals: List[Any] = []
        out_prev: List[Any] = []
        for iid, _pid in zip(ids_icon, ids_prev):
            if _same_rid(iid.get("rid"), target_rid):
                out_vals.append(new_icon)
                out_prev.append(_preview_icon(new_icon))
            else:
                out_vals.append(no_update)
                out_prev.append(no_update)
        return out_vals, out_prev

    @app.callback(
        Output("receipt-location-store", "data"),
        Output("receipt-location-rows", "children"),
        Input("receipt-location-add", "n_clicks"),
        State("receipt-location-store", "data"),
        prevent_initial_call=True,
    )
    def _add_row(n_clicks, data):
        if not n_clicks:
            raise PreventUpdate
        rows = list(data or [])
        rows.append(
            {
                "receipt_location_id": None,
                "slot": None,
                "receipt_location_name": "",
                "receipt_location_icon": "bi-box",
                "_key": f"new_{uuid.uuid4().hex[:10]}",
            }
        )
        return rows, build_receipt_location_row_blocks(rows)

    @app.callback(
        Output("receipt-location-save-result", "children"),
        Output("receipt-location-store", "data", allow_duplicate=True),
        Output("receipt-location-rows", "children", allow_duplicate=True),
        Input("receipt-location-save", "n_clicks"),
        State({"type": "rl-name", "rid": ALL}, "value"),
        State({"type": "rl-name", "rid": ALL}, "id"),
        State({"type": "rl-icon", "rid": ALL}, "value"),
        State({"type": "rl-icon", "rid": ALL}, "id"),
        State("receipt-location-store", "data"),
        prevent_initial_call=True,
    )
    def _save_rows(
        n_clicks, name_vals, name_ids, icon_vals, icon_ids, store_data
    ):
        if not n_clicks:
            raise PreventUpdate
        names = _map_rid_values(name_vals, name_ids)
        icons = _map_rid_values(icon_vals, icon_ids)
        rows = list(store_data or [])
        errors: List[str] = []

        updates: List[tuple] = []
        creates: List[tuple] = []

        for row in rows:
            key = _rid_key(row)
            name = names.get(key, row.get("receipt_location_name") or "")
            icon = icons.get(key, row.get("receipt_location_icon") or "")
            rid = row.get("receipt_location_id")

            if rid is not None:
                if (
                    normalize_receipt_location_name(name) is None
                    or normalize_receipt_location_icon(icon) is None
                ):
                    errors.append(
                        "名称またはアイコンを確認してください（空欄や無効な形式です）。"
                    )
                else:
                    updates.append((int(rid), name, icon))
            else:
                if not (name or "").strip():
                    continue
                if (
                    normalize_receipt_location_name(name) is None
                    or normalize_receipt_location_icon(icon) is None
                ):
                    errors.append(
                        "追加行の名称またはアイコンを確認してください。"
                    )
                else:
                    creates.append((name, icon))

        if errors:
            return (" ".join(dict.fromkeys(errors)), no_update, no_update)

        for rid, name, icon in updates:
            if not update_receipt_location_tag(rid, name, icon):
                return (
                    "保存に失敗しました。通信または権限を確認してください。",
                    no_update,
                    no_update,
                )

        for name, icon in creates:
            if not create_receipt_location_tag(name, icon):
                return (
                    "追加行の保存に失敗しました。通信または権限を確認してください。",
                    no_update,
                    no_update,
                )

        refreshed = get_receipt_location_tags_ordered()
        return (
            "保存しました。",
            refreshed,
            build_receipt_location_row_blocks(refreshed),
        )

    @app.callback(
        Output("receipt-location-store", "data", allow_duplicate=True),
        Output("receipt-location-rows", "children", allow_duplicate=True),
        Output("receipt-location-save-result", "children", allow_duplicate=True),
        Input({"type": "rl-delete", "rid": ALL}, "n_clicks"),
        State("receipt-location-store", "data"),
        prevent_initial_call=True,
    )
    def _delete_row(_n_clicks, store_data):
        trig = callback_context.triggered[0] if callback_context.triggered else None
        if not trig or trig.get("value") in (None, 0):
            raise PreventUpdate
        tid = callback_context.triggered_id
        if not isinstance(tid, dict) or tid.get("type") != "rl-delete":
            raise PreventUpdate
        rid_key = tid.get("rid")
        rows = list(store_data or [])
        if isinstance(rid_key, str) and rid_key.startswith("new_"):
            new_rows = _store_remove_row(rows, rid_key)
            return new_rows, build_receipt_location_row_blocks(new_rows), ""
        try:
            rid_int = int(rid_key)
        except (TypeError, ValueError):
            raise PreventUpdate
        if not delete_receipt_location_tag(rid_int):
            return no_update, no_update, "削除に失敗しました。"
        refreshed = get_receipt_location_tags_ordered()
        return refreshed, build_receipt_location_row_blocks(refreshed), "削除しました。"

    @app.callback(
        Output("receipt-location-store", "data", allow_duplicate=True),
        Output("receipt-location-rows", "children", allow_duplicate=True),
        Output("receipt-location-save-result", "children", allow_duplicate=True),
        Input({"type": "rl-move", "rid": ALL, "dir": ALL}, "n_clicks"),
        State("receipt-location-store", "data"),
        prevent_initial_call=True,
    )
    def _move_row(_n_clicks, store_data):
        tid = callback_context.triggered_id
        if not isinstance(tid, dict) or tid.get("type") != "rl-move":
            raise PreventUpdate
        # 同一コールバック内で triggered[0] が必ずしもクリック元とは限らないため n_clicks を列挙で確認
        clicked = False
        for t in callback_context.triggered:
            if not t or t.get("value") in (None, 0):
                continue
            pid = str(t.get("prop_id", ""))
            if "rl-move" in pid:
                clicked = True
                break
        if not clicked:
            raise PreventUpdate
        rid_key = tid.get("rid")
        direction = (tid.get("dir") or "").strip()
        if direction not in ("up", "down"):
            raise PreventUpdate
        rows = list(store_data or [])
        if isinstance(rid_key, str) and rid_key.startswith("new_"):
            new_rows = _store_move_row(rows, rid_key, direction)
            if new_rows is None:
                raise PreventUpdate
            return new_rows, build_receipt_location_row_blocks(new_rows), ""
        try:
            rid_int = int(rid_key)
        except (TypeError, ValueError):
            raise PreventUpdate
        if not move_receipt_location_tag(rid_int, direction):
            return no_update, no_update, "移動できませんでした。"
        refreshed = get_receipt_location_tags_ordered()
        return refreshed, build_receipt_location_row_blocks(refreshed), "並び順を更新しました。"
