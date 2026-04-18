import uuid
from typing import Any, Dict, List, Optional

from dash import Input, Output, State, no_update, ALL, callback_context
from dash.exceptions import PreventUpdate

from features.category_tag.components import (
    build_category_tag_row_blocks,
    _preview_icon,
)
from services.tag_service import (
    create_category_tag,
    delete_category_tag,
    get_category_tags_ordered,
    move_category_tag,
    normalize_category_color,
    normalize_category_icon,
    normalize_category_name,
    update_category_tag,
)


def _cid_key(row: Dict[str, Any]) -> Any:
    cid = row.get("category_tag_id")
    if cid is not None:
        return cid
    return row.get("_key")


def _same_cid(a: Any, b: Any) -> bool:
    """dict id の cid（int / str）を比較する。"""
    return a == b or str(a) == str(b)


def _store_remove_row(rows: List[Dict[str, Any]], cid_key: Any) -> List[Dict[str, Any]]:
    return [r for r in rows if not _same_cid(_cid_key(r), cid_key)]


def _store_move_row(
    rows: List[Dict[str, Any]], cid_key: Any, direction: str
) -> Optional[List[Dict[str, Any]]]:
    rows = list(rows)
    idx = next(
        (i for i, r in enumerate(rows) if _same_cid(_cid_key(r), cid_key)),
        None,
    )
    if idx is None:
        return None
    j = idx - 1 if direction == "up" else idx + 1
    if j < 0 or j >= len(rows):
        return None
    rows[idx], rows[j] = rows[j], rows[idx]
    return rows


def _map_cid_values(values: Optional[List], ids: Optional[List]) -> Dict[Any, str]:
    out: Dict[Any, str] = {}
    for v, i in zip(values or [], ids or []):
        if not isinstance(i, dict):
            continue
        cid = i.get("cid")
        out[cid] = (v or "").strip()
    return out


def register_category_tag_callbacks(app):
    @app.callback(
        Output({"type": "ct-icon", "cid": ALL}, "value"),
        Output({"type": "ct-icon-preview", "cid": ALL}, "children"),
        Input({"type": "ct-icon-tile", "cid": ALL, "icon": ALL}, "n_clicks"),
        State({"type": "ct-icon", "cid": ALL}, "id"),
        State({"type": "ct-icon-preview", "cid": ALL}, "id"),
        State({"type": "ct-color", "cid": ALL}, "value"),
        State({"type": "ct-color", "cid": ALL}, "id"),
        prevent_initial_call=True,
    )
    def _pick_icon_tile(_n_clicks, icon_ids, preview_ids, color_vals, color_ids):
        tid = callback_context.triggered_id
        if not isinstance(tid, dict) or tid.get("type") != "ct-icon-tile":
            raise PreventUpdate
        target_cid = tid.get("cid")
        new_icon = (tid.get("icon") or "").strip()
        if not new_icon:
            raise PreventUpdate
        colors = _map_cid_values(color_vals, color_ids)
        row_color = colors.get(target_cid, "")
        ids_icon = list(icon_ids or [])
        ids_prev = list(preview_ids or [])
        if len(ids_icon) != len(ids_prev):
            raise PreventUpdate
        out_vals: List[Any] = []
        out_prev: List[Any] = []
        for iid, _pid in zip(ids_icon, ids_prev):
            if _same_cid(iid.get("cid"), target_cid):
                out_vals.append(new_icon)
                out_prev.append(_preview_icon(new_icon, row_color))
            else:
                out_vals.append(no_update)
                out_prev.append(no_update)
        return out_vals, out_prev

    @app.callback(
        Output({"type": "ct-icon-preview", "cid": ALL}, "children", allow_duplicate=True),
        Input({"type": "ct-color", "cid": ALL}, "value"),
        State({"type": "ct-color", "cid": ALL}, "id"),
        State({"type": "ct-icon", "cid": ALL}, "value"),
        State({"type": "ct-icon", "cid": ALL}, "id"),
        State({"type": "ct-icon-preview", "cid": ALL}, "id"),
        prevent_initial_call=True,
    )
    def _sync_icon_preview_color(_colors, color_ids, icon_vals, icon_ids, preview_ids):
        """カラーピッカー変更時に各プレビューの色だけ更新する。"""
        colors = _map_cid_values(_colors, color_ids)
        icons = _map_cid_values(icon_vals, icon_ids)
        out: List[Any] = []
        for pid in preview_ids or []:
            if not isinstance(pid, dict):
                out.append(no_update)
                continue
            cid = pid.get("cid")
            raw_c = colors.get(cid, "")
            icon = icons.get(cid, "") or ""
            out.append(_preview_icon(icon, raw_c))
        return out

    @app.callback(
        Output("category-tag-store", "data"),
        Output("category-tag-rows", "children"),
        Input("category-tag-add", "n_clicks"),
        State("category-tag-store", "data"),
        prevent_initial_call=True,
    )
    def _add_row(n_clicks, data):
        if not n_clicks:
            raise PreventUpdate
        rows = list(data or [])
        rows.append(
            {
                "category_tag_id": None,
                "slot": None,
                "category_tag_name": "",
                "category_tag_color": "#6c757d",
                "category_tag_icon": "bi-tag",
                "_key": f"new_{uuid.uuid4().hex[:10]}",
            }
        )
        return rows, build_category_tag_row_blocks(rows)

    @app.callback(
        Output("category-tag-save-result", "children"),
        Output("category-tag-store", "data", allow_duplicate=True),
        Output("category-tag-rows", "children", allow_duplicate=True),
        Input("category-tag-save", "n_clicks"),
        State({"type": "ct-name", "cid": ALL}, "value"),
        State({"type": "ct-name", "cid": ALL}, "id"),
        State({"type": "ct-color", "cid": ALL}, "value"),
        State({"type": "ct-color", "cid": ALL}, "id"),
        State({"type": "ct-icon", "cid": ALL}, "value"),
        State({"type": "ct-icon", "cid": ALL}, "id"),
        State("category-tag-store", "data"),
        prevent_initial_call=True,
    )
    def _save_rows(
        n_clicks,
        name_vals,
        name_ids,
        color_vals,
        color_ids,
        icon_vals,
        icon_ids,
        store_data,
    ):
        if not n_clicks:
            raise PreventUpdate
        names = _map_cid_values(name_vals, name_ids)
        colors = _map_cid_values(color_vals, color_ids)
        icons = _map_cid_values(icon_vals, icon_ids)
        rows = list(store_data or [])
        errors: List[str] = []

        updates: List[tuple] = []
        creates: List[tuple] = []

        for row in rows:
            key = _cid_key(row)
            name = names.get(key, row.get("category_tag_name") or "")
            raw_color = colors.get(key, row.get("category_tag_color") or "")
            icon = icons.get(key, row.get("category_tag_icon") or "")
            rid = row.get("category_tag_id")

            if rid is not None:
                if (
                    normalize_category_name(name) is None
                    or normalize_category_color(raw_color) is None
                    or normalize_category_icon(icon) is None
                ):
                    errors.append(
                        "名称・色・アイコンを確認してください（空欄や無効な形式です）。"
                    )
                else:
                    updates.append((int(rid), name, raw_color, icon))
            else:
                if not (name or "").strip():
                    continue
                if (
                    normalize_category_name(name) is None
                    or normalize_category_color(raw_color) is None
                    or normalize_category_icon(icon) is None
                ):
                    errors.append(
                        "追加行の名称・色・アイコンを確認してください。"
                    )
                else:
                    creates.append((name, raw_color, icon))

        if errors:
            return (" ".join(dict.fromkeys(errors)), no_update, no_update)

        for cid, name, col, icon in updates:
            if not update_category_tag(cid, name, col, icon):
                return (
                    "保存に失敗しました。通信または権限を確認してください。",
                    no_update,
                    no_update,
                )

        for name, col, icon in creates:
            if not create_category_tag(name, col, icon):
                return (
                    "追加行の保存に失敗しました。通信または権限を確認してください。",
                    no_update,
                    no_update,
                )

        refreshed = get_category_tags_ordered()
        return (
            "保存しました。",
            refreshed,
            build_category_tag_row_blocks(refreshed),
        )

    @app.callback(
        Output("category-tag-store", "data", allow_duplicate=True),
        Output("category-tag-rows", "children", allow_duplicate=True),
        Output("category-tag-save-result", "children", allow_duplicate=True),
        Input({"type": "ct-delete", "cid": ALL}, "n_clicks"),
        State("category-tag-store", "data"),
        prevent_initial_call=True,
    )
    def _delete_row(_n_clicks, store_data):
        trig = callback_context.triggered[0] if callback_context.triggered else None
        if not trig or trig.get("value") in (None, 0):
            raise PreventUpdate
        tid = callback_context.triggered_id
        if not isinstance(tid, dict) or tid.get("type") != "ct-delete":
            raise PreventUpdate
        cid_key = tid.get("cid")
        rows = list(store_data or [])
        if isinstance(cid_key, str) and cid_key.startswith("new_"):
            new_rows = _store_remove_row(rows, cid_key)
            return new_rows, build_category_tag_row_blocks(new_rows), ""
        try:
            cid_int = int(cid_key)
        except (TypeError, ValueError):
            raise PreventUpdate
        if not delete_category_tag(cid_int):
            return no_update, no_update, "削除に失敗しました。"
        refreshed = get_category_tags_ordered()
        return refreshed, build_category_tag_row_blocks(refreshed), "削除しました。"

    @app.callback(
        Output("category-tag-store", "data", allow_duplicate=True),
        Output("category-tag-rows", "children", allow_duplicate=True),
        Output("category-tag-save-result", "children", allow_duplicate=True),
        Input({"type": "ct-move", "cid": ALL, "dir": ALL}, "n_clicks"),
        State("category-tag-store", "data"),
        prevent_initial_call=True,
    )
    def _move_row(_n_clicks, store_data):
        tid = callback_context.triggered_id
        if not isinstance(tid, dict) or tid.get("type") != "ct-move":
            raise PreventUpdate
        clicked = False
        for t in callback_context.triggered:
            if not t or t.get("value") in (None, 0):
                continue
            pid = str(t.get("prop_id", ""))
            if "ct-move" in pid:
                clicked = True
                break
        if not clicked:
            raise PreventUpdate
        cid_key = tid.get("cid")
        direction = (tid.get("dir") or "").strip()
        if direction not in ("up", "down"):
            raise PreventUpdate
        rows = list(store_data or [])
        if isinstance(cid_key, str) and cid_key.startswith("new_"):
            new_rows = _store_move_row(rows, cid_key, direction)
            if new_rows is None:
                raise PreventUpdate
            return new_rows, build_category_tag_row_blocks(new_rows), ""
        try:
            cid_int = int(cid_key)
        except (TypeError, ValueError):
            raise PreventUpdate
        if not move_category_tag(cid_int, direction):
            return no_update, no_update, "移動できませんでした。"
        refreshed = get_category_tags_ordered()
        return refreshed, build_category_tag_row_blocks(refreshed), "並び順を更新しました。"
