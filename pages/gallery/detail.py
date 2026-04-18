from urllib.parse import parse_qs

import dash_bootstrap_components as dbc
from dash import html, dcc, register_page, callback, Input, Output, State
from dash.exceptions import PreventUpdate

from services.supabase_client import get_supabase_client
from services.photo_service import create_signed_url_for_object
from services.tag_service import (
    ensure_default_color_tags,
    get_category_tags_ordered,
    get_receipt_location_tags_ordered,
)


def _current_members_id():
    try:
        from flask import g, has_app_context
    except Exception:
        return None
    if not has_app_context():
        return None
    uid = getattr(g, "user_id", None)
    return str(uid) if uid else None


def _read_query(search: str) -> tuple[str | None, str]:
    """Query文字列から registration_product_id と view を取り出す。"""
    params = parse_qs(search.lstrip("?") if search else "")
    pid = params.get("registration_product_id", [None])[0]
    view = params.get("view", ["thumb"])[0] or "thumb"
    return pid, view


def _render_error(message: str) -> html.Div:
    return html.Div(
        [
            html.Div(
                [
                    html.I(className="bi bi-exclamation-triangle me-2"),
                    message,
                ],
                className="text-danger fw-semibold",
            ),
            html.A(
                [html.I(className="bi bi-arrow-left me-2"), "ギャラリーに戻る"],
                href="/gallery",
                className="btn btn-outline-primary btn-sm mt-3",
            ),
        ],
        className="card-main-danger mb-4",
    )


def _norm_embed_one(field):
    """PostgREST の埋め込みが dict / 単要素 list のとき dict に正規化する。"""
    if isinstance(field, list):
        if not field:
            return None
        first = field[0]
        return first if isinstance(first, dict) else None
    if isinstance(field, dict):
        return field
    return None


def _extract_color_slots(record: dict) -> list[int]:
    rpct = record.get("registration_product_color_tag")
    slots: list[int] = []
    if isinstance(rpct, list):
        for x in rpct:
            if isinstance(x, dict) and x.get("slot") is not None:
                try:
                    slots.append(int(x["slot"]))
                except (TypeError, ValueError):
                    continue
    elif isinstance(rpct, dict) and rpct.get("slot") is not None:
        try:
            slots.append(int(rpct["slot"]))
        except (TypeError, ValueError):
            pass
    return sorted(set(slots))


def _color_checklist_options():
    color_tags = ensure_default_color_tags() or []
    opts = []
    for item in color_tags:
        slot = item.get("slot")
        if slot is None:
            continue
        try:
            si = int(slot)
        except (TypeError, ValueError):
            continue
        opts.append(
            {
                "label": html.Span(
                    [
                        html.Span(
                            "",
                            style={
                                "display": "inline-block",
                                "width": "16px",
                                "height": "16px",
                                "background": item.get("color_tag_color") or "#6c757d",
                                "borderRadius": "4px",
                                "border": "1px solid rgba(0,0,0,0.2)",
                                "marginRight": "6px",
                            },
                        ),
                        html.Span(item.get("color_tag_name") or f"slot {si}"),
                    ],
                    className="d-inline-flex align-items-center",
                ),
                "value": si,
            }
        )
    return opts


def _bi_class(icon: str | None, fallback: str) -> str:
    """Bootstrap Icons 用クラス（bi- 接頭辞を補う）。"""
    ic = (icon or "").strip()
    if not ic:
        return fallback
    if ic.startswith("bi-"):
        return ic
    return f"bi-{ic}"


def _category_dropdown_options():
    rows = get_category_tags_ordered() or []
    opts = []
    for row in rows:
        if int(row.get("category_tag_use_flag") or 0) != 1:
            continue
        cid = row.get("category_tag_id")
        if cid is None:
            continue
        try:
            cid_int = int(cid)
        except (TypeError, ValueError):
            continue
        name = (row.get("category_tag_name") or "").strip() or f"ID{cid_int}"
        bi = _bi_class(row.get("category_tag_icon"), "bi-tag")
        opts.append(
            {
                "label": html.Span(
                    [
                        html.I(className=f"{bi} me-2", style={"fontSize": "1rem"}),
                        html.Span(name),
                    ],
                    className="d-inline-flex align-items-center gallery-tag-dropdown-label",
                ),
                "value": cid_int,
            }
        )
    return opts


def _receipt_dropdown_options():
    rows = get_receipt_location_tags_ordered() or []
    opts = []
    for row in rows:
        if int(row.get("receipt_location_use_flag") or 0) != 1:
            continue
        rid = row.get("receipt_location_id")
        if rid is None:
            continue
        try:
            rid_int = int(rid)
        except (TypeError, ValueError):
            continue
        name = (row.get("receipt_location_name") or "").strip() or f"ID{rid_int}"
        bi = _bi_class(row.get("receipt_location_icon"), "bi-box-seam")
        opts.append(
            {
                "label": html.Span(
                    [
                        html.I(className=f"{bi} me-2", style={"fontSize": "1rem"}),
                        html.Span(name),
                    ],
                    className="d-inline-flex align-items-center gallery-tag-dropdown-label",
                ),
                "value": rid_int,
            }
        )
    return opts


def _resolve_thumb_from_photo(photo_field, supabase):
    """photoフィールドが list/dict いずれでもサムネURLを返す。object path は signed URL に変換。"""
    if isinstance(photo_field, list):
        candidate = None
        for item in photo_field:
            if isinstance(item, dict) and item.get("front_flag") == 1:
                candidate = item
                break
        if candidate is None and photo_field:
            first = photo_field[0]
            candidate = first if isinstance(first, dict) else None
        if candidate:
            url = candidate.get("photo_high_resolution_url") or candidate.get(
                "photo_thumbnail_url"
            )
            return create_signed_url_for_object(supabase, url) if url else None
    elif isinstance(photo_field, dict):
        url = photo_field.get("photo_high_resolution_url") or photo_field.get(
            "photo_thumbnail_url"
        )
        return create_signed_url_for_object(supabase, url) if url else None
    return None


def _render_detail_card(record: dict, back_view: str, supabase) -> html.Div:
    photo = record.get("photo")
    thumb = _resolve_thumb_from_photo(photo, supabase) or create_signed_url_for_object(
        supabase, record.get("photo_high_resolution_url") or record.get("photo_thumbnail_url")
    )

    slot_map = {
        int(t.get("slot")): (t.get("color_tag_name") or str(t.get("slot")))
        for t in (ensure_default_color_tags() or [])
        if t.get("slot") is not None
    }
    color_names = [
        slot_map.get(s, str(s)) for s in _extract_color_slots(record)
    ]
    ct = _norm_embed_one(record.get("category_tag"))
    rl = _norm_embed_one(record.get("receipt_location"))
    raw_cid = record.get("category_tag_id")
    raw_rid = record.get("receipt_location_id")
    if ct and ct.get("category_tag_name"):
        cat_label = str(ct.get("category_tag_name"))
    elif raw_cid not in (None, ""):
        cat_label = "表示できないタグ"
    else:
        cat_label = "未設定"
    if rl and rl.get("receipt_location_name"):
        loc_label = str(rl.get("receipt_location_name"))
    elif raw_rid not in (None, ""):
        loc_label = "表示できないタグ"
    else:
        loc_label = "未設定"

    rows = [
        ("製品名", record.get("product_name") or "未設定"),
        ("分類", record.get("product_group_name") or "未設定"),
        ("作品シリーズ", record.get("works_series_name") or "未設定"),
        ("作品名", record.get("title") or "未設定"),
        ("キャラクター", record.get("character_name") or "未設定"),
        ("バーコード", record.get("barcode_number") or "未取得"),
        ("バーコード種別", record.get("barcode_type") or "不明"),
        ("購入価格", record.get("purchase_price") or "未入力"),
        ("購入場所", record.get("purchase_location") or "未入力"),
        ("メモ", record.get("memo") or "記録なし"),
        ("カラータグ", ", ".join(color_names) if color_names else "未設定"),
        ("カテゴリータグ", cat_label),
        ("収納場所タグ", loc_label),
        ("作成日時", record.get("creation_date") or "不明"),
        ("更新日時", record.get("updated_date") or "不明"),
    ]

    info_list = html.Ul(
        [
            html.Li(
                [
                    html.Span(f"{label}：", className="fw-semibold me-1"),
                    html.Span(str(value)),
                ],
                className="mb-2",
            )
            for label, value in rows
        ],
        className="list-unstyled mb-0",
    )

    return html.Div(
        [
            html.Div(
                [
                    html.A(
                        [html.I(className="bi bi-arrow-left me-2"), "ギャラリーに戻る"],
                        href=f"/gallery?view={back_view}",
                        className="btn btn-outline-secondary btn-sm mb-3",
                    ),
                    html.H1("写真の詳細", className="h4 mb-3"),
                ],
                className="d-flex flex-column",
            ),
            html.Div(
                [
                    html.Div(
                        [
                            html.Img(
                                src=thumb,
                                className="img-fluid rounded shadow-sm",
                                style={"maxHeight": "360px", "objectFit": "cover"},
                            )
                            if thumb
                            else html.Div(
                                [
                                    html.I(
                                        className="bi bi-image",
                                        style={"fontSize": "48px"},
                                    ),
                                    html.P("画像が登録されていません", className="text-muted"),
                                ],
                                className="d-flex flex-column align-items-center justify-content-center border rounded p-4 text-center",
                            )
                        ],
                        className="col-12 col-md-5",
                    ),
                    html.Div(
                        [
                            html.H5("登録情報", className="mb-3"),
                            info_list,
                        ],
                        className="col-12 col-md-7",
                    ),
                ],
                className="row g-4 align-items-start",
            ),
        ],
        className="card-main-secondary mb-4",
    )


def _detail_select_fragment():
    """PostgREST 用の select 断片（製品・写真・タグ・カラー中間）。"""
    return """
        *,
        photo(
            photo_thumbnail_url,
            photo_high_resolution_url,
            front_flag,
            photo_theme_color
        ),
        category_tag(
            category_tag_name,
            category_tag_color,
            category_tag_icon
        ),
        receipt_location(
            receipt_location_name,
            receipt_location_icon
        ),
        registration_product_color_tag(slot)
    """


def _detail_select_without_color_junction():
    """registration_product_color_tag の埋め込みが使えない DB 向け。"""
    return """
        *,
        photo(
            photo_thumbnail_url,
            photo_high_resolution_url,
            front_flag,
            photo_theme_color
        ),
        category_tag(
            category_tag_name,
            category_tag_color,
            category_tag_icon
        ),
        receipt_location(
            receipt_location_name,
            receipt_location_icon
        )
    """


def load_detail_record(search: str):
    """
    詳細表示用レコードを返す。
    戻り値: (成功時 record dict, None) / (None, error_div)
    """
    pid, _view = _read_query(search)
    if not pid:
        return None, _render_error("registration_product_id が指定されていません。")

    supabase = get_supabase_client()
    if supabase is None:
        return None, _render_error("データ取得に失敗しました（Supabase 未設定）。")

    members_id = _current_members_id()
    try:
        q = (
            supabase.table("registration_product_information")
            .select(_detail_select_fragment())
            .eq("registration_product_id", pid)
        )
        if members_id:
            q = q.eq("members_id", members_id)
        res = q.limit(1).execute()
        data = res.data if hasattr(res, "data") else []
        if not data:
            return None, _render_error("指定されたデータが見つかりませんでした。")
        return data[0], None
    except Exception:
        try:
            from services.product_color_tag_service import get_product_color_tag_slots

            q2 = (
                supabase.table("registration_product_information")
                .select(_detail_select_without_color_junction())
                .eq("registration_product_id", pid)
            )
            if members_id:
                q2 = q2.eq("members_id", members_id)
            res2 = q2.limit(1).execute()
            data2 = res2.data if hasattr(res2, "data") else []
            if not data2:
                return None, _render_error("指定されたデータが見つかりませんでした。")
            rec = data2[0]
            try:
                pid_int = int(rec.get("registration_product_id") or pid)
            except (TypeError, ValueError):
                return None, _render_error("指定されたデータが見つかりませんでした。")
            sm = get_product_color_tag_slots(supabase, members_id, [pid_int])
            slots = sm.get(pid_int, [])
            rec["registration_product_color_tag"] = [{"slot": s} for s in slots]
            return rec, None
        except Exception as e2:
            return None, _render_error(f"データ取得に失敗しました: {e2}")


def _empty_tag_outputs():
    """エラー時・非表示用のタグ編集系 Output 値。"""
    return (
        None,
        [],
        [],
        [],
        None,
        [],
        None,
        {"display": "none"},
    )


@callback(
    [
        Output("gallery-detail-root", "children"),
        Output("gallery-detail-product-id", "data"),
        Output("gallery-detail-color-slots", "options"),
        Output("gallery-detail-color-slots", "value"),
        Output("gallery-detail-category-tag", "options"),
        Output("gallery-detail-category-tag", "value"),
        Output("gallery-detail-receipt-location", "options"),
        Output("gallery-detail-receipt-location", "value"),
        Output("gallery-detail-tag-section", "style"),
    ],
    Input("_pages_location", "search"),
    State("_pages_location", "pathname"),
    prevent_initial_call=False,
)
def _on_query_change(search, pathname):
    if pathname != "/gallery/detail":
        raise PreventUpdate
    if search is None:
        raise PreventUpdate
    pid, _ = _read_query(search)
    if not pid:
        raise PreventUpdate

    supabase = get_supabase_client()
    record, err = load_detail_record(search)
    if err is not None or record is None:
        return (err, *_empty_tag_outputs())

    try:
        pid_int = int(record.get("registration_product_id") or pid)
    except (TypeError, ValueError):
        return (_render_error("製品 ID が不正です。"), *_empty_tag_outputs())

    _, view = _read_query(search)
    card = _render_detail_card(record, back_view=view, supabase=supabase)

    color_opts = _color_checklist_options()
    color_val = _extract_color_slots(record)

    cat_opts = _category_dropdown_options()
    raw_cid = record.get("category_tag_id")
    try:
        cat_val = int(raw_cid) if raw_cid is not None and raw_cid != "" else None
    except (TypeError, ValueError):
        cat_val = None
    if cat_val is not None and not any(o.get("value") == cat_val for o in cat_opts):
        cat_val = None

    rec_opts = _receipt_dropdown_options()
    raw_rid = record.get("receipt_location_id")
    try:
        rec_val = int(raw_rid) if raw_rid is not None and raw_rid != "" else None
    except (TypeError, ValueError):
        rec_val = None
    if rec_val is not None and not any(o.get("value") == rec_val for o in rec_opts):
        rec_val = None

    return (
        card,
        pid_int,
        color_opts,
        color_val,
        cat_opts,
        cat_val,
        rec_opts,
        rec_val,
        {"display": "block"},
    )


register_page(
    __name__,
    path="/gallery/detail",
    title="写真の詳細 - ギャラリー",
)

try:
    layout = html.Div(
        [
            dcc.Location(id="gallery-detail-location"),
            html.Div(id="gallery-detail-root"),
            html.Div(
                id="gallery-detail-tag-section",
                style={"display": "none"},
                className="card-main-secondary mb-4 p-3",
                children=[
                    html.H5("タグの編集", className="mb-2"),
                    html.P(
                        [
                            "タグ名・アイコン・色の変更は ",
                            html.A(
                                "設定",
                                href="/settings",
                                className="text-decoration-none",
                            ),
                            " から行えます。",
                        ],
                        className="text-muted small mb-3",
                    ),
                    dcc.Store(id="gallery-detail-product-id", data=None),
                    html.Label("カラータグ（複数可・最大7）", className="form-label small mb-1"),
                    dcc.Checklist(
                        id="gallery-detail-color-slots",
                        options=[],
                        value=[],
                        className="d-flex flex-wrap gap-2",
                    ),
                    html.Label("カテゴリータグ", className="form-label small mt-2 mb-1"),
                    dcc.Dropdown(
                        id="gallery-detail-category-tag",
                        options=[],
                        value=None,
                        clearable=True,
                        placeholder="未設定",
                        className="mb-2 gallery-tag-dropdown",
                        optionHeight=40,
                    ),
                    html.Label("収納場所タグ", className="form-label small mb-1"),
                    dcc.Dropdown(
                        id="gallery-detail-receipt-location",
                        options=[],
                        value=None,
                        clearable=True,
                        placeholder="未設定",
                        className="mb-2 gallery-tag-dropdown",
                        optionHeight=40,
                    ),
                    dbc.Button(
                        "タグを保存",
                        id="gallery-detail-save-tags",
                        color="primary",
                        size="sm",
                        className="mt-1",
                        n_clicks=0,
                    ),
                    html.Div(id="gallery-detail-tag-save-alert", className="mt-2 small"),
                ],
            ),
        ]
    )
except Exception as e:
    layout = html.Div(
        f"Gallery detail page error: {str(e)}", style={"color": "red", "padding": "20px"}
    )
