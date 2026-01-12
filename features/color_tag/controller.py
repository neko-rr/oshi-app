from typing import Any, Dict, List

from dash import Input, Output, State, no_update, callback_context, ALL
from dash.exceptions import PreventUpdate
from services.tag_service import save_color_tags, ensure_default_color_tags


def register_color_tag_callbacks(app):
    @app.callback(
        Output("color-tag-save-result", "children"),
        Output("color-tag-store", "data"),
        Input("color-tag-save", "n_clicks"),
        State({"type": "color-tag-color", "slot": ALL}, "value"),
        State({"type": "color-tag-color", "slot": ALL}, "id"),
        State({"type": "color-tag-name", "slot": ALL}, "value"),
        State({"type": "color-tag-name", "slot": ALL}, "id"),
        prevent_initial_call=True,
    )
    def _save_color_tags(n_clicks, colors, color_ids, names, name_ids):
        if not n_clicks:
            raise PreventUpdate

        # slotごとに集約
        entries: Dict[int, Dict[str, Any]] = {}
        try:
            for val, cid in zip(colors or [], color_ids or []):
                slot = int(cid.get("slot"))
                entries[slot] = {
                    "slot": slot,
                    "color_tag_color": val,
                    "color_tag_name": entries.get(slot, {}).get("color_tag_name"),
                }
            for val, nid in zip(names or [], name_ids or []):
                slot = int(nid.get("slot"))
                if slot not in entries:
                    entries[slot] = {"slot": slot}
                entries[slot]["color_tag_name"] = val
        except Exception:
            return ("入力の取得に失敗しました。もう一度お試しください。", no_update)

        # 1..7を揃える
        slots = sorted(entries.keys())
        if len(slots) != 7 or slots[0] != 1 or slots[-1] != 7:
            return ("7色すべて入力してください。", no_update)

        payload: List[Dict[str, Any]] = [entries[s] for s in sorted(entries.keys())]

        ok = save_color_tags(payload)
        if not ok:
            return ("保存に失敗しました（入力または権限を確認）。", no_update)

        updated = ensure_default_color_tags()
        return ("保存しました。", updated)
