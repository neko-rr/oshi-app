from dash import html
from dash import dcc
from dash import callback, Output, Input, State, callback_context, register_page, no_update
from dash.dependencies import ALL
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc
from typing import Mapping, List, Dict, Any
from services.tag_service import ensure_default_color_tags
from services.product_color_tag_service import get_product_color_tag_slots

Photo = Mapping[str, str]


def _gallery_store_loading() -> dict:
    """初回・再取得前。pathname コールバック完了まで空リストと区別する。"""
    return {
        "status": "loading",
        "items": [],
        "offset": 0,
        "hasMore": False,
        "v": 1,
    }


def _gallery_store_ready_for_cache(store_data) -> bool:
    """session に「取得済み」が載っているとき True（pathname で再フェッチを省略）。"""
    if store_data is None:
        return False
    if isinstance(store_data, list):
        return True
    if not isinstance(store_data, dict):
        return False
    if store_data.get("status") == "loading":
        return False
    return True


def _gallery_products_loading(store_data) -> bool:
    """UI はローディング。None は旧セッション互換。"""
    if store_data is None:
        return True
    if isinstance(store_data, dict) and store_data.get("status") == "loading":
        return True
    return False


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
    ids: List[int] = []
    for p in products:
        if not isinstance(p, dict):
            continue
        raw = p.get("registration_product_id")
        if raw is None or raw == "":
            continue
        try:
            ids.append(int(raw))
        except (TypeError, ValueError):
            continue
    slots_map = get_product_color_tag_slots(supabase, None, ids)
    for p in products:
        if not isinstance(p, dict):
            continue
        raw = p.get("registration_product_id")
        try:
            pid_int = int(raw) if raw is not None and raw != "" else None
        except (TypeError, ValueError):
            pid_int = None
        p["color_slots"] = slots_map.get(pid_int, []) if pid_int is not None else []
    return products


def _slot_to_color_map() -> Dict[int, str]:
    tags = ensure_default_color_tags() or []
    out: Dict[int, str] = {}
    for t in tags:
        s = t.get("slot")
        if s is None:
            continue
        try:
            out[int(s)] = str(t.get("color_tag_color") or "#6c757d")
        except (TypeError, ValueError):
            continue
    return out


def _embed_dict(row: Dict[str, Any], key: str):
    v = row.get(key)
    if isinstance(v, list):
        if not v:
            return None
        first = v[0]
        return first if isinstance(first, dict) else None
    if isinstance(v, dict):
        return v
    return None


def _render_product_tag_chips(photo: Dict[str, Any]) -> html.Div:
    """一覧カード用のタグチップ（カラー・カテゴリ・収納）。"""
    sm = _slot_to_color_map()
    pieces: List[Any] = []
    for s in photo.get("color_slots") or []:
        try:
            si = int(s)
        except (TypeError, ValueError):
            continue
        bg = sm.get(si, "#adb5bd")
        pieces.append(
            html.Span(
                "",
                title=f"色スロット{si}",
                style={
                    "display": "inline-block",
                    "width": "10px",
                    "height": "10px",
                    "borderRadius": "2px",
                    "background": bg,
                    "border": "1px solid rgba(0,0,0,0.12)",
                },
            )
        )
    ct = _embed_dict(photo, "category_tag")
    if ct and ct.get("category_tag_name"):
        ic = (ct.get("category_tag_icon") or "bi-tag").strip()
        if not ic.startswith("bi-"):
            ic = f"bi-{ic}" if ic else "bi-tag"
        pieces.append(
            html.Span(
                [html.I(className=ic, style={"fontSize": "0.75rem"})],
                className="badge rounded-pill bg-light text-dark border",
                style={"padding": "2px 6px"},
                title=str(ct.get("category_tag_name") or ""),
            )
        )
    rl = _embed_dict(photo, "receipt_location")
    if rl and rl.get("receipt_location_name"):
        ic = (rl.get("receipt_location_icon") or "bi-box-seam").strip()
        if not ic.startswith("bi-"):
            ic = f"bi-{ic}" if ic else "bi-box-seam"
        pieces.append(
            html.Span(
                [html.I(className=ic, style={"fontSize": "0.75rem"})],
                className="badge rounded-pill bg-light text-dark border",
                style={"padding": "2px 6px"},
                title=str(rl.get("receipt_location_name") or ""),
            )
        )
    if not pieces:
        return html.Div()
    return html.Div(pieces, className="d-flex flex-wrap gap-1 align-items-center mt-1")


def _normalize_gallery_color_filter_slots(raw) -> List[int]:
    """Store 由来の値を 1..7 の整数リストに正規化（bool の True→1 等を除外）。"""
    out: List[int] = []
    if raw is None:
        return out
    if isinstance(raw, bool):
        return out
    if isinstance(raw, int):
        return [raw] if 1 <= raw <= 7 else out
    if not isinstance(raw, (list, tuple)):
        return out
    for x in raw:
        if isinstance(x, bool):
            continue
        try:
            i = int(x)
        except (TypeError, ValueError):
            continue
        if 1 <= i <= 7 and i not in out:
            out.append(i)
    return sorted(out)


def _filter_products(products: List[Dict[str, Any]], text: str, slots: List[int]):
    """テキストとカラータグでフィルタ。slotsはOR、テキストはAND適用。"""
    text = (text or "").strip().lower()
    slots_set = set(_normalize_gallery_color_filter_slots(slots or []))

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


def _render_gallery_loading():
    """取得完了までのプレースホルダ（空件メッセージと混同させない）。"""
    return html.Div(
        [
            html.Div(
                role="status",
                className="spinner-border text-primary mb-3",
                children=html.Span("読み込み中", className="visually-hidden"),
            ),
            html.Div("写真一覧を読み込んでいます…", className="text-muted"),
        ],
        className="card-main-secondary mb-4 p-4 text-center",
        style={"minHeight": "12rem"},
    )


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
            className="card-main-secondary mb-4",
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
                                _render_product_tag_chips(photo),
                            ],
                            className="p-2",
                            style={
                                "minHeight": "72px",
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
                    "minHeight": "228px",
                    "height": "auto",
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
                                            _render_product_tag_chips(photo),
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
    from urllib.parse import parse_qs

    # gallery-products-store / gallery-color-filter は app.layout ルートに常設（詳細・他ページでもコールバック可）

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
        className="card-main-secondary mb-3",
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
        className="card-main-info mb-3",
    )

    dashboard_content = html.Div(
        [
            tag_search,
            view_toggle,
            html.Div(
                [
                    html.Button(
                        "最新を取得",
                        id="gallery-refresh-list",
                        className="btn btn-outline-secondary btn-sm me-2",
                        n_clicks=0,
                    ),
                    html.Button(
                        "さらに表示",
                        id="gallery-load-more",
                        className="btn btn-outline-primary btn-sm",
                        n_clicks=0,
                        disabled=True,
                    ),
                ],
                className="d-flex justify-content-end mb-2",
            ),
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
    selected_set = set(_normalize_gallery_color_filter_slots(selected_slots))
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
    try:
        slot_i = int(slot)
    except (TypeError, ValueError):
        raise PreventUpdate
    if not (1 <= slot_i <= 7):
        raise PreventUpdate

    # ALL の再マウント等で n_clicks=0 のまま発火すると slot 1 だけ選ばれる誤動作になるため、対象ボタンの実クリックのみ処理する
    seq = n_clicks if isinstance(n_clicks, (list, tuple)) else (() if n_clicks is None else (n_clicks,))
    idx = slot_i - 1
    if idx < 0 or idx >= len(seq):
        raise PreventUpdate
    try:
        clicks_here = int(seq[idx] or 0)
    except (TypeError, ValueError):
        raise PreventUpdate
    if clicks_here < 1:
        raise PreventUpdate

    current = set(_normalize_gallery_color_filter_slots(selected))
    if slot_i in current:
        current.remove(slot_i)
    else:
        if len(current) < 7:
            current.add(slot_i)
    return sorted(current)


def _gallery_items_from_store(store_data):
    """session Store の dict / 旧 list 双方を許容する。"""
    if store_data is None:
        return []
    if isinstance(store_data, dict):
        return [p for p in (store_data.get("items") or []) if isinstance(p, dict)]
    if isinstance(store_data, list):
        return [p for p in store_data if isinstance(p, dict)]
    return []


def _gallery_pack(items, has_more: bool) -> dict:
    return {
        "status": "ready",
        "items": items,
        "offset": len(items),
        "hasMore": has_more,
        "v": 1,
    }


@callback(
    Output("gallery-products-store", "data", allow_duplicate=True),
    Output("gallery-tags-dirty", "data", allow_duplicate=True),
    Output("gallery-color-filter", "data", allow_duplicate=True),
    Input("_pages_location", "pathname"),
    State("nav-history-store", "data"),
    State("gallery-products-store", "data"),
    State("gallery-tags-dirty", "data"),
    prevent_initial_call="initial_duplicate",
)
def _gallery_on_pathname(pathname, nav_hist, cur, dirty):
    """他画面から /gallery へ来たときの初回・再訪。登録フローからは常に再取得（C2）。"""
    from services.photo_service import get_products_page
    from services.supabase_client import get_supabase_client

    if pathname != "/gallery":
        raise PreventUpdate

    page_size = 48
    supabase = get_supabase_client()
    if supabase is None:
        return _gallery_pack([], False), no_update, []

    prev_path = (nav_hist or {}).get("prev") if isinstance(nav_hist, dict) else None
    from_register = isinstance(prev_path, str) and prev_path.startswith("/register")
    need_refresh = isinstance(dirty, dict) and bool(dirty.get("refresh"))
    # loading プレースホルダは truthy のため、ready のときだけキャッシュを使う
    if _gallery_store_ready_for_cache(cur) and not from_register and not need_refresh:
        raise PreventUpdate

    batch = get_products_page(supabase, limit=page_size, offset=0)
    batch = _attach_color_slots(supabase, batch)
    pack = _gallery_pack(batch, len(batch) >= page_size)
    dirty_out = None if need_refresh else no_update
    # 一覧をサーバーから取り直したタイミングでは色フィルターをクリア（誤選択・タグ保存後の不整合を防ぐ）
    return pack, dirty_out, []


@callback(
    Output("gallery-products-store", "data", allow_duplicate=True),
    Input("gallery-load-more", "n_clicks"),
    Input("gallery-refresh-list", "n_clicks"),
    State("gallery-products-store", "data"),
    State("_pages_location", "pathname"),
    prevent_initial_call="initial_duplicate",
)
def _gallery_on_pager(n_more, n_refresh, cur, pathname):
    """ページングと手動更新（ボタン）。"""
    from dash.exceptions import PreventUpdate as PU
    from services.photo_service import get_products_page
    from services.supabase_client import get_supabase_client

    if pathname != "/gallery":
        raise PU

    ctx = callback_context
    if not ctx.triggered:
        raise PU
    prop_id = str(ctx.triggered[0].get("prop_id") or "")
    page_size = 48
    supabase = get_supabase_client()
    if supabase is None:
        return _gallery_pack([], False)

    if "gallery-refresh-list" in prop_id:
        if not n_refresh:
            raise PU
        batch = get_products_page(supabase, limit=page_size, offset=0)
        batch = _attach_color_slots(supabase, batch)
        return _gallery_pack(batch, len(batch) >= page_size)

    if "gallery-load-more" in prop_id:
        if not n_more:
            raise PU

        prev_items = _gallery_items_from_store(cur)
        offset = len(prev_items)
        more = get_products_page(supabase, limit=page_size, offset=offset)
        more = _attach_color_slots(supabase, more)
        merged = prev_items + list(more)
        return _gallery_pack(merged, len(more) >= page_size)

    raise PU


@callback(
    [
        Output("gallery-load-more", "disabled"),
        Output("gallery-content", "children"),
    ],
    Input("gallery-products-store", "data"),
    Input("gallery-color-filter", "data"),
    State("gallery-search-input", "value", allow_optional=True),
    State("gallery-view-mode", "value", allow_optional=True),
    State("_pages_location", "pathname"),
    prevent_initial_call=False,
)
def _gallery_products_to_ui(store_data, selected_slots, text, view_mode, pathname):
    """同一トリガーで「さらに表示」無効化とグリッド描画をまとめ、往復を削減する。"""
    if pathname != "/gallery":
        raise PreventUpdate
    view_mode = view_mode or "thumb"
    if _gallery_products_loading(store_data):
        return True, _render_gallery_loading()

    if not store_data or not isinstance(store_data, dict):
        load_more_disabled = True
    else:
        load_more_disabled = not bool(store_data.get("hasMore"))

    products = _gallery_items_from_store(store_data)
    slots_clean = _normalize_gallery_color_filter_slots(selected_slots)
    filtered = _filter_products(products, text, slots_clean)
    return load_more_disabled, _render_cards(filtered, view_mode)


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
    if triggered.get("type") != "gallery-thumb":
        raise PreventUpdate

    pid = triggered.get("index")
    if not pid:
        raise PreventUpdate

    # Dash 3 + ALL では triggered の value が「全サムネの n_clicks 配列」のことがあり単一 int にならない。
    # 再マウントだけの発火ではすべて 0。いずれか >= 1 のときだけ実クリックとみなす。
    if isinstance(clicks, (list, tuple)):
        seq = clicks
    elif clicks is None:
        seq = ()
    else:
        seq = (clicks,)
    has_real_click = False
    for x in seq:
        try:
            if int(x or 0) >= 1:
                has_real_click = True
                break
        except (TypeError, ValueError):
            continue
    if not has_real_click:
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
