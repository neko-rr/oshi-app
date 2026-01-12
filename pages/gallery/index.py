from dash import html
from dash import dcc
from dash import callback, Output, Input, State, callback_context, register_page
from dash.dependencies import ALL
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc
from typing import Mapping, List, Dict, Any
from services.tag_service import ensure_default_color_tags
from services.product_color_tag_service import get_product_color_tag_slots

Photo = Mapping[str, str]


def _photo_unique_id(photo: Photo, fallback: str) -> str:
    return (
        photo.get("registration_product_id")
        or photo.get("photo_id")
        or photo.get("barcode_number")
        or fallback
    )


def _photo_thumb_url(photo: Photo):
    """サムネイルURLを解決する（製品行/写真行どちらの形でも対応）。"""
    if not isinstance(photo, dict):
        return None

    # top-level（photo行/旧データ形）を優先
    direct = (
        photo.get("image_url")
        or photo.get("photo_thumbnail_url")
        or photo.get("photo_high_resolution_url")
    )
    if direct:
        return direct

    # registration_product_information の行（photo をネスト）に対応
    nested = photo.get("photo")
    if isinstance(nested, list):
        # front_flag==1 を優先、無ければ先頭
        candidate = None
        for item in nested:
            if isinstance(item, dict) and item.get("front_flag") == 1:
                candidate = item
                break
        if candidate is None and nested:
            candidate = nested[0] if isinstance(nested[0], dict) else None
        if candidate:
            return candidate.get("photo_thumbnail_url") or candidate.get(
                "photo_high_resolution_url"
            )
    elif isinstance(nested, dict):
        return nested.get("photo_thumbnail_url") or nested.get(
            "photo_high_resolution_url"
        )
    return None


def _attach_color_slots(
    supabase, products: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """製品リストに color_slots を付与する。"""
    if not products:
        return products
    ids = [
        p.get("registration_product_id")
        for p in products
        if isinstance(p, dict) and p.get("registration_product_id")
    ]
    slots_map = get_product_color_tag_slots(supabase, None, ids)
    for p in products:
        pid = p.get("registration_product_id")
        p["color_slots"] = slots_map.get(pid, [])
    return products


def _filter_products(products: List[Dict[str, Any]], text: str, slots: List[int]):
    """テキストとカラータグでフィルタ。slotsはOR、テキストはAND適用。"""
    text = (text or "").strip().lower()
    slots_set = set(int(s) for s in slots or [])

    def match_text(p: Dict[str, Any]) -> bool:
        if not text:
            return True
        fields = [
            p.get("product_name"),
            p.get("product_group_name"),
            p.get("works_series_name"),
            p.get("title"),
            p.get("character_name"),
            p.get("memo"),
        ]
        return any((f or "").lower().find(text) >= 0 for f in fields)

    def match_slots(p: Dict[str, Any]) -> bool:
        if not slots_set:
            return True
        ps = set(int(s) for s in p.get("color_slots") or [])
        return bool(ps & slots_set)  # OR

    return [p for p in products if match_text(p) and match_slots(p)]


def _render_cards(products: List[Dict[str, Any]], view_mode: str):
    if not products:
        return html.Div(
            [
                html.H4("まだ写真が登録されていません", className="mb-2"),
                html.Div(
                    "「写真を登録」からバーコードまたは写真で登録を開始できます。",
                    className="text-muted",
                ),
                html.A(
                    [html.I(className="bi bi-camera me-2"), "写真を登録する"],
                    href="/register/barcode",
                    className="btn btn-primary mt-3",
                ),
            ],
            className="card p-4 mb-4",
        )

    summary = html.Div(
        [
            html.P(
                f"全 {len(products)} 件の登録があります",
                className="text-muted text-center mb-4",
            )
        ]
    )
    grid_items = []
    for photo in products:
        thumb_url = _photo_thumb_url(photo)
        content = html.Div(
            [
                (
                    html.Img(
                        src=thumb_url,
                        style={
                            "width": "100%",
                            "height": "150px",
                            "objectFit": "cover",
                            "borderTopLeftRadius": "10px",
                            "borderTopRightRadius": "10px",
                        },
                    )
                    if thumb_url
                    else html.Div(
                        [
                            html.I(
                                className="bi bi-image",
                                style={"fontSize": "28px"},
                            )
                        ],
                        className="d-flex align-items-center justify-content-center photo-placeholder",
                        style={
                            "height": "150px",
                            "borderTopLeftRadius": "10px",
                            "borderTopRightRadius": "10px",
                            "background": "#f8f9fa",
                        },
                    )
                ),
                html.Div(
                    [
                        html.Div(
                            photo.get("product_name") or "名称未設定",
                            className="fw-semibold text-dark",
                        ),
                        html.Div(
                            photo.get("title")
                            or photo.get("character_name")
                            or photo.get("works_series_name")
                            or "説明なし",
                            className="text-muted small",
                        ),
                    ],
                    className="p-2",
                    style={
                        "height": "64px",
                        "overflow": "hidden",
                    },
                ),
            ],
            className="h-100"
        )

        card = (
            html.Button(
                content,
                id={"type": "gallery-thumb", "index": photo.get("registration_product_id")},
                className="photo-card-btn text-start p-0 border-0",
                n_clicks=0,
                style={
                    "borderRadius": "10px",
                    "overflow": "hidden",
                    "boxShadow": "0 2px 6px rgba(0,0,0,0.08)",
                    "background": "var(--bs-card-bg)",
                    "height": "214px",
                    "width": "100%",
                },
            )
            if not photo.get("_dummy")
            else html.Div(
                html.Div(
                    [
                        html.Div(
                            [
                                html.I(
                                    className="bi bi-image",
                                    style={"fontSize": "28px"},
                                )
                            ],
                            className="d-flex align-items-center justify-content-center photo-placeholder",
                            style={
                                "height": "150px",
                                "background": "#f8f9fa",
                            },
                        ),
                        html.Div(
                            [
                                html.Div("サンプル枠", className="fw-bold text-dark mb-1"),
                                html.Div("追加の写真が表示されます", className="text-muted small"),
                            ],
                            className="p-2",
                        ),
                    ],
                    className="h-100",
                ),
                style={
                    "borderRadius": "10px",
                    "overflow": "hidden",
                    "boxShadow": "0 2px 6px rgba(0,0,0,0.08)",
                    "background": "var(--bs-card-bg)",
                    "height": "214px",
                    "width": "100%",
                },
            )
        )
        grid_items.append(card)

    grid = html.Div(
        grid_items,
        className="photo-grid",
        id="gallery-grid-wrapper",
        style={} if view_mode == "thumb" else {"display": "none"},
    )

    list_view = html.Div(
        [
            html.Div(
                [
                    dbc.ListGroup(
                        [
                            dbc.ListGroupItem(
                                [
                                    html.Img(
                                        src=_photo_thumb_url(photo),
                                        style={
                                            "width": "56px",
                                            "height": "56px",
                                            "objectFit": "cover",
                                        },
                                        className="rounded",
                                    )
                                    if _photo_thumb_url(photo)
                                    else html.Div(
                                        html.I(
                                            className="bi bi-image",
                                            style={"fontSize": "22px"},
                                        ),
                                        className="d-flex align-items-center justify-content-center border rounded",
                                        style={"width": "56px", "height": "56px"},
                                    ),
                                    html.Div(
                                        [
                                            html.Div(
                                                photo.get("product_name")
                                                or "名称未設定",
                                                className="fw-semibold text-dark",
                                            ),
                                            html.Div(
                                                photo.get("title")
                                                or photo.get("character_name")
                                                or photo.get("works_series_name")
                                                or "説明なし",
                                                className="text-muted small",
                                            ),
                                            html.Div(
                                                photo.get("memo") or "",
                                                className="text-muted small",
                                            ),
                                        ],
                                        className="flex-grow-1 text-start",
                                    ),
                                ],
                                id={
                                    "type": "gallery-thumb",
                                    "index": photo.get("registration_product_id"),
                                },
                                className="list-group-item list-group-item-action d-flex align-items-center gap-3",
                                n_clicks=0,
                            )
                            for photo in products
                        ]
                    )
                ]
            )
        ],
        className="list-group mb-4",
        id="gallery-list-wrapper",
        style={} if view_mode == "list" else {"display": "none"},
    )

    return html.Div([summary, grid, list_view])


def render_gallery(search: str = "", view: str = "thumb", **kwargs) -> html.Div:
    from services.photo_service import get_all_products
    from services.supabase_client import get_supabase_client
    from urllib.parse import parse_qs

    supabase = get_supabase_client()
    if supabase is None:
        products = []
    else:
        products = get_all_products(supabase) or []
        products = _attach_color_slots(supabase, products)

    real_photos_for_store = [p for p in products if isinstance(p, dict)]
    photo_store_component = dcc.Store(
        id="gallery-products-store", data=real_photos_for_store
    )
    color_filter_store = dcc.Store(id="gallery-color-filter", data=[])

    qs = parse_qs(search.lstrip("?") if search else "")
    initial_view = view or qs.get("view", ["thumb"])[0] or "thumb"

    # ヘッダー
    header = html.Div(
        [html.H1([html.I(className="bi bi-images me-2"), "ギャラリー"])],
        className="header",
    )

    user_color_tags = ensure_default_color_tags()
    if user_color_tags:
        color_tag_palette = [
            (
                (item.get("color_tag_name") or f"色{item.get('slot')}"),
                (item.get("color_tag_color") or "#6c757d"),
            )
            for item in user_color_tags
        ]
    else:
        color_tag_palette = [
            ("赤", "#dc3545"),
            ("青", "#0d6efd"),
            ("緑", "#198754"),
            ("黄", "#ffc107"),
            ("紫", "#6f42c1"),
            ("黒", "#212529"),
            ("白", "#f8f9fa"),
        ]

    tag_search = html.Div(
        [
            html.H4("タグ検索", className="card-title"),
            html.Div(
                [
                    dcc.Input(
                        id="gallery-search-input",
                        placeholder="タグで検索（例: 猫、白、キーホルダー）",
                        className="form-control me-2",
                        style={"maxWidth": "420px"},
                        type="text",
                    ),
                ],
                className="d-flex flex-column flex-md-row align-items-start",
            ),
            html.Div(
                [
                    html.Button(
                        "",
                        id={"type": "gallery-color-swatch", "slot": idx + 1},
                        title=str(name),
                        className="btn p-0 border-0 me-2 mb-2",
                        style={
                            "display": "inline-block",
                            "width": "32px",
                            "height": "32px",
                            "background": color,
                            "borderRadius": "8px",
                            "border": "1px solid rgba(0,0,0,0.15)",
                        },
                        n_clicks=0,
                    )
                    for idx, (name, color) in enumerate(color_tag_palette)
                ],
                className="mt-2",
            ),
        ],
        className="card text-white bg-secondary mb-3",
    )

    view_toggle = html.Div(
        [
            dbc.RadioItems(
                id="gallery-view-mode",
                options=[
                    {"label": "サムネイル", "value": "thumb"},
                    {"label": "リスト", "value": "list"},
                ],
                value=initial_view,
                inline=True,
                className="mb-3",
            )
        ],
        className="card p-3 mb-3",
    )

    dashboard_content = html.Div(
        [
            photo_store_component,
            color_filter_store,
            tag_search,
            view_toggle,
            html.Div(id="gallery-content"),
        ]
    )

    return html.Div(
        [header, dashboard_content, dcc.Location(id="gallery-location", refresh=False)]
    )


@callback(
    Output({"type": "gallery-color-swatch", "slot": ALL}, "style"),
    Input("gallery-color-filter", "data"),
    State({"type": "gallery-color-swatch", "slot": ALL}, "style"),
    prevent_initial_call=False,
)
def _update_swatch_styles(selected_slots, styles):
    selected_set = set(int(s) for s in (selected_slots or []))
    user_color_tags = ensure_default_color_tags() or []
    slot_to_color = {
        int(item.get("slot")): (item.get("color_tag_color") or "#6c757d")
        for item in user_color_tags
        if item.get("slot")
    }
    fallback_colors = [
        "#dc3545",
        "#0d6efd",
        "#198754",
        "#ffc107",
        "#6f42c1",
        "#212529",
        "#f8f9fa",
    ]

    updated = []
    target_count = len(styles or [])
    for idx in range(target_count):
        slot = idx + 1
        base_color = slot_to_color.get(slot)
        if not base_color and idx < len(fallback_colors):
            base_color = fallback_colors[idx]
        base_color = base_color or "#6c757d"

        style = {
            "display": "inline-block",
            "width": "32px",
            "height": "32px",
            "background": base_color,
            "borderRadius": "8px",
            "border": "3px solid #0d6efd"
            if slot in selected_set
            else "1px solid rgba(0,0,0,0.15)",
        }
        if slot in selected_set:
            style["boxShadow"] = "0 0 0 0.2rem rgba(13, 110, 253, 0.25)"
        updated.append(style)
    return updated


@callback(
    Output("gallery-color-filter", "data"),
    Input({"type": "gallery-color-swatch", "slot": ALL}, "n_clicks"),
    State("gallery-color-filter", "data"),
    prevent_initial_call=True,
)
def _toggle_color_filter(n_clicks, selected):
    ctx = callback_context
    if not ctx.triggered:
        raise PreventUpdate
    trig = ctx.triggered_id
    if not isinstance(trig, dict):
        raise PreventUpdate
    slot = trig.get("slot")
    if slot is None:
        raise PreventUpdate
    current = set(int(s) for s in (selected or []))
    if int(slot) in current:
        current.remove(int(slot))
    else:
        if len(current) < 7:
            current.add(int(slot))
    return sorted(current)


@callback(
    Output("gallery-content", "children"),
    Input("gallery-products-store", "data"),
    Input("gallery-color-filter", "data"),
    Input("gallery-search-input", "value"),
    Input("gallery-view-mode", "value"),
    prevent_initial_call=False,
)
def _render_filtered_content(products, selected_slots, text, view_mode):
    view_mode = view_mode or "thumb"
    products = products or []
    filtered = _filter_products(products, text, selected_slots)
    return _render_cards(filtered, view_mode)


@callback(
    Output("_pages_location", "pathname", allow_duplicate=True),
    Output("_pages_location", "search", allow_duplicate=True),
    Input({"type": "gallery-thumb", "index": ALL}, "n_clicks"),
    State("_pages_location", "search"),
    prevent_initial_call="initial_duplicate",
)
def _navigate_to_detail(clicks, current_search):
    from urllib.parse import parse_qs

    ctx = callback_context
    if not ctx.triggered:
        raise PreventUpdate

    triggered = ctx.triggered_id
    if not isinstance(triggered, dict):
        raise PreventUpdate

    pid = triggered.get("index")
    if not pid:
        raise PreventUpdate

    qs = parse_qs((current_search or "").lstrip("?"))
    view_mode = qs.get("view", ["thumb"])[0] or "thumb"

    return (
        "/gallery/detail",
        f"?registration_product_id={pid}&view={view_mode or 'thumb'}",
    )


register_page(
    __name__,
    path="/gallery",
    title="ギャラリー - おしごとアプリ",
)

layout = render_gallery
