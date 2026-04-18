"""ギャラリー詳細のタグ保存など。"""

from dash import callback, Input, Output, State, html, no_update
from dash.exceptions import PreventUpdate

from services.product_assignment_service import set_product_category_and_receipt
from services.product_color_tag_service import set_product_color_tags
from services.supabase_client import get_supabase_client


def _clean_color_slots(raw) -> list[int]:
    out: list[int] = []
    seen = set()
    if not raw:
        return out
    seq = raw if isinstance(raw, (list, tuple)) else [raw]
    for x in seq:
        try:
            si = int(x)
        except (TypeError, ValueError):
            continue
        if 1 <= si <= 7 and si not in seen:
            out.append(si)
            seen.add(si)
        if len(out) >= 7:
            break
    return out


def register_gallery_callbacks(app):
    @app.callback(
        [
            Output("gallery-detail-tag-save-alert", "children", allow_duplicate=True),
            Output("gallery-tags-dirty", "data", allow_duplicate=True),
        ],
        Input("gallery-detail-save-tags", "n_clicks"),
        State("gallery-detail-product-id", "data"),
        State("gallery-detail-color-slots", "value"),
        State("gallery-detail-category-tag", "value"),
        State("gallery-detail-receipt-location", "value"),
        prevent_initial_call=True,
    )
    def _save_gallery_tags(n_clicks, product_id, color_val, category_val, receipt_val):
        if not n_clicks:
            raise PreventUpdate
        if not product_id:
            return (
                html.Span("製品が選択されていません。", className="text-danger"),
                no_update,
            )

        supabase = get_supabase_client()
        if supabase is None:
            return (
                html.Span("接続に失敗しました。", className="text-danger"),
                no_update,
            )

        try:
            pid = int(product_id)
        except (TypeError, ValueError):
            return (
                html.Span("製品 ID が不正です。", className="text-danger"),
                no_update,
            )

        slots = _clean_color_slots(color_val)
        ok_fk, msg_fk = set_product_category_and_receipt(
            supabase,
            None,
            pid,
            category_tag_id=category_val,
            receipt_location_id=receipt_val,
        )
        if not ok_fk:
            return html.Span(msg_fk or "保存に失敗しました。", className="text-danger"), no_update

        ok_color = set_product_color_tags(supabase, None, pid, slots)
        if not ok_color:
            return (
                html.Span(
                    "カテゴリ・収納は保存しましたが、カラータグの保存に失敗しました。",
                    className="text-warning",
                ),
                {"refresh": True},
            )

        return (
            html.Span("保存しました。", className="text-success"),
            {"refresh": True},
        )
