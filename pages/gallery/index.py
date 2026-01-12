from dash import html
from dash import dcc
from dash import callback, Output, Input, State, callback_context, register_page, no_update
from dash.dependencies import ALL
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
from typing import Iterable, Mapping
import random
from services.tag_service import ensure_default_color_tags

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
    nested = photo.get("photo") or {}
    return nested.get("photo_thumbnail_url") or nested.get("photo_high_resolution_url")


def _render_detail_content(photo: Photo) -> html.Div:
    thumbnail = _photo_thumb_url(photo)
    info_rows = [
        ("製品名", photo.get("product_name") or "未設定"),
        ("分類", photo.get("product_group_name") or "未設定"),
        ("作品シリーズ", photo.get("works_series_name") or "未設定"),
        ("作品名", photo.get("title") or "未設定"),
        ("キャラクター", photo.get("character_name") or "未設定"),
        ("バーコード", photo.get("barcode_number") or "未取得"),
        ("メモ", photo.get("memo") or "記録なし"),
    ]

    info_list = html.Ul(
        [
            html.Li(
                [
                    html.Span(f"{label}：", className="fw-semibold me-1"),
                    html.Span(value),
                ],
                className="mb-2",
            )
            for label, value in info_rows
        ],
        className="list-unstyled mb-0",
    )

    return html.Div(
        [
            html.Div(
                [
                    html.Div(
                        html.Img(
                            src=thumbnail,
                            className="img-fluid rounded shadow-sm",
                            style={"maxHeight": "320px", "objectFit": "cover"},
                        )
                        if thumbnail
                        else html.Div(
                            [
                                html.I(
                                    className="bi bi-image",
                                    style={"fontSize": "48px"},
                                ),
                                html.P(
                                    "画像が登録されていません", className="text-muted"
                                ),
                            ],
                            className="d-flex flex-column align-items-center justify-content-center border rounded p-4 text-center",
                        ),
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
            )
        ]
    )


def render_gallery(search: str = "") -> html.Div:
    from services.photo_service import get_all_products
    from services.supabase_client import get_supabase_client
    from urllib.parse import parse_qs

    supabase = get_supabase_client()
    if supabase is None:
        products = []
    else:
        # get_all_products は registration_product_information の行に photo をネストした形で返す
        products = get_all_products(supabase) or []

    # 実データが0件かどうかの判定用（ダミー補完前）
    real_products_count = len([p for p in products if isinstance(p, dict)])

    TARGET_CARD_COUNT = 8  # ダミーカードを含めた表示枚数（見かけだけ）

    # 不足分をダミーで補完
    if len(products) < TARGET_CARD_COUNT:
        for i in range(TARGET_CARD_COUNT - len(products)):
            products.append(
                {
                    "registration_product_id": f"dummy-{i}",
                    "barcode_number": "DUMMY",
                    "product_name": None,
                    "product_group_name": None,
                    "works_series_name": None,
                    "title": None,
                    "character_name": None,
                    "memo": None,
                    "photo": {
                        "photo_thumbnail_url": None,
                        "photo_high_resolution_url": None,
                    },
                    "_dummy": True,
                }
            )

    # 詳細表示は実データのみ（ダミーは除外）
    real_photos_for_store = [
        p for p in products if isinstance(p, dict) and not p.get("_dummy")
    ]
    # ※ State依存を避けるため、詳細遷移でこのStoreは参照しない（残置は将来の拡張用）
    photo_store_component = dcc.Store(id="gallery-photo-data", data=real_photos_for_store)

    # search の view パラメータから初期表示を決定
    qs = parse_qs(search.lstrip("?") if search else "")
    initial_view = qs.get("view", ["thumb"])[0] or "thumb"

    # ヘッダー
    header = html.Div(
        [html.H1([html.I(className="bi bi-images me-2"), "ギャラリー"])],
        className="header",
    )

    # タグ検索（見かけだけ）: ユーザー設定のカラータグを使用
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
                        placeholder="タグで検索（例: 猫、白、キーホルダー）",
                        className="form-control me-2",
                        style={"maxWidth": "420px"},
                        type="text",
                    ),
                    html.Button("検索", className="btn btn-light mt-2 mt-md-0"),
                ],
                className="d-flex flex-column flex-md-row align-items-start",
            ),
            html.Div(
                [
                    dbc.Badge(
                        name,
                        className="me-2 mb-2",
                        style={"backgroundColor": color, "color": "#000000"},
                    )
                    for name, color in color_tag_palette
                ],
                className="mt-2",
            ),
        ],
        className="card text-white bg-secondary mb-3",
    )

    # 初期表示のスタイル（view パラメータに従う）
    grid_style = {} if initial_view == "thumb" else {"display": "none"}
    list_style = {} if initial_view == "list" else {"display": "none"}

    if real_products_count == 0:
        dashboard_content = html.Div(
            [
                photo_store_component,
                tag_search,
                html.Div(
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
                ),
            ]
        )
    else:
        # 写真がある場合はギャラリー表示
        summary = html.Div(
            [
                html.P(
                    f"全 {len(real_photos_for_store)} 件の登録があります",
                    className="text-muted text-center mb-4",
                )
            ]
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
        grid = html.Div(
            [
                html.Div(
                    [
                        (
                            html.Button(
                                html.Div(
                                    [
                                        (
                                            html.Img(
                                                src=_photo_thumb_url(photo),
                                                style={
                                                    "width": "100%",
                                                    "height": "150px",
                                                    "objectFit": "cover",
                                                },
                                            )
                                            if _photo_thumb_url(photo)
                                            else html.Div(
                                                [
                                                    html.I(
                                                        className="bi bi-image",
                                                        style={"fontSize": "28px"},
                                                    )
                                                ],
                                                className="d-flex align-items-center justify-content-center photo-placeholder",
                                            )
                                        ),
                                        html.Div(
                                            [
                                                html.Div(
                                                    f"バーコード: {(photo.get('barcode_number') or photo.get('barcode') or '')[:15]}...",
                                                    className="fw-bold text-dark mb-1",
                                                ),
                                                html.Div(
                                                    photo.get("description")
                                                    or "説明なし",
                                                    className="text-muted small",
                                                ),
                                            ],
                                            className="photo-info",
                                        ),
                                    ],
                                    className="photo-card",
                                ),
                                id={
                                    "type": "gallery-thumb",
                                    "index": _photo_unique_id(photo, f"photo-{i}"),
                                },
                                className="photo-card-btn",
                                n_clicks=0,
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
                                        ),
                                        html.Div(
                                            [
                                                html.Div(
                                                    "サンプル枠",
                                                    className="fw-bold text-dark mb-1",
                                                ),
                                                html.Div(
                                                    "追加の写真が表示されます",
                                                    className="text-muted small",
                                                ),
                                            ],
                                            className="photo-info",
                                        ),
                                    ],
                                    className="photo-card",
                                )
                            )
                        )
                    ]
                )
                for i, photo in enumerate(products)
            ],
            className="photo-grid",
            id="gallery-grid-wrapper",
            style=grid_style,
        )
        list_view = html.Div(
            [
                html.Button(
                    [
                        (
                            html.Img(
                                src=_photo_thumb_url(photo),
                                style={
                                    "width": "56px",
                                    "height": "56px",
                                    "objectFit": "cover",
                                    "borderRadius": "10px",
                                },
                            )
                            if _photo_thumb_url(photo)
                            else html.Div(
                                html.I(
                                    className="bi bi-image", style={"fontSize": "22px"}
                                ),
                                className="d-flex align-items-center justify-content-center border rounded",
                                style={"width": "56px", "height": "56px"},
                            )
                        ),
                        html.Div(
                            [
                                html.Div(
                                    photo.get("product_name") or "名称未設定",
                                    className="fw-semibold text-dark",
                                ),
                                html.Div(
                                    [
                                        *[
                                            dbc.Badge(
                                                n,
                                                color=c,
                                                className=(
                                                    "me-1"
                                                    + (" text-dark" if c == "light" else "")
                                                ),
                                            )
                                            for n, c in (
                                                [
                                                    color_tag_palette[
                                                        (i * 2) % len(color_tag_palette)
                                                    ],
                                                    color_tag_palette[
                                                        (i * 2 + 1)
                                                        % len(color_tag_palette)
                                                    ],
                                                ]
                                            )
                                        ]
                                    ],
                                    className="mt-1",
                                ),
                            ],
                            className="flex-grow-1 text-start",
                        ),
                    ],
                    id={"type": "gallery-thumb", "index": photo.get("registration_product_id")},
                    className="list-group-item list-group-item-action d-flex align-items-center gap-3",
                    n_clicks=0,
                )
                for i, photo in enumerate(real_photos_for_store)
            ],
            className="list-group mb-4",
            id="gallery-list-wrapper",
            style=list_style,
        )

        dashboard_content = html.Div(
            [
                photo_store_component,
                tag_search,
                summary,
                view_toggle,
                grid,
                list_view,
            ]
        )

    return html.Div([header, dashboard_content, dcc.Location(id="gallery-location", refresh=False)])


@callback(
    Output("gallery-grid-wrapper", "style"),
    Output("gallery-list-wrapper", "style"),
    Input("gallery-view-mode", "value"),
)
def _toggle_gallery_view(mode: str):
    mode = mode or "thumb"
    if mode == "list":
        return {"display": "none"}, {}
    return {}, {"display": "none"}


@callback(
    Output("_pages_location", "pathname", allow_duplicate=True),
    Output("_pages_location", "search", allow_duplicate=True),
    Input({"type": "gallery-thumb", "index": ALL}, "n_clicks"),
    State("gallery-view-mode", "value"),
    prevent_initial_call="initial_duplicate",
)
def _navigate_to_detail(clicks, view_mode):
    ctx = callback_context
    if not ctx.triggered:
        raise PreventUpdate

    triggered = ctx.triggered_id
    if not isinstance(triggered, dict):
        raise PreventUpdate

    pid = triggered.get("index")
    if not pid:
        raise PreventUpdate

    return "/gallery/detail", f"?registration_product_id={pid}&view={view_mode or 'thumb'}"


register_page(
    __name__,
    path="/gallery",
    title="ギャラリー - おしごとアプリ",
)

try:
    layout = render_gallery()
except Exception as e:
    layout = html.Div(
        f"Gallery page error: {str(e)}", style={"color": "red", "padding": "20px"}
    )


