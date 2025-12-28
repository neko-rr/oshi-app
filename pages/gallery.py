from dash import html
from dash import dcc
from dash import callback, Output, Input, State, callback_context, register_page
from dash.dependencies import ALL
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
from typing import Iterable, Mapping
import random

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


def _photo_full_url(photo: Photo):
    """フルサイズURLを解決する（製品行/写真行どちらの形でも対応）。"""
    if not isinstance(photo, dict):
        return None

    direct = photo.get("photo_high_resolution_url")
    if direct:
        return direct

    nested = photo.get("photo") or {}
    return nested.get("photo_high_resolution_url") or _photo_thumb_url(photo)


def _render_detail_content(photo: Photo) -> html.Div:
    thumbnail = _photo_full_url(photo)
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


def render_gallery() -> html.Div:
    from services.photo_service import get_all_products
    from services.supabase_client import get_supabase_client

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
    photo_store_component = dcc.Store(
        id="gallery-photo-data", data=real_photos_for_store
    )

    # ヘッダー
    header = html.Div(
        [html.H1([html.I(className="bi bi-images me-2"), "ギャラリー"])],
        className="header",
    )

    # デモ用グラフデータ
    def create_category_pie_chart():
        """カテゴリ別商品数の円グラフ"""
        labels = ["キーホルダー", "缶バッジ", "アクリルスタンド", "その他"]
        values = [0, 0, 0, 0]  # デモ用に全て0

        fig = go.Figure(
            data=[
                go.Pie(
                    labels=labels,
                    values=values,
                    marker_colors=["#FF6B9D", "#4ECDC4", "#45B7D1", "#96CEB4"],
                    title="商品カテゴリ分布",
                )
            ]
        )

        fig.update_layout(
            font_family="Arial",
            font_size=12,
            margin=dict(l=20, r=20, t=40, b=20),
            height=250,  # 高さを少し小さく
        )

        return fig

    def create_monthly_bar_chart():
        """月別収集数の棒グラフ"""
        months = ["1月", "2月", "3月", "4月", "5月", "6月"]
        counts = [0, 0, 0, 0, 0, 0]  # デモ用に全て0

        fig = go.Figure(
            data=[go.Bar(x=months, y=counts, marker_color="#FF6B9D", name="収集数")]
        )

        fig.update_layout(
            title="月別収集数",
            xaxis_title="月",
            yaxis_title="個数",
            font_family="Arial",
            font_size=12,
            margin=dict(l=20, r=20, t=40, b=20),
            height=250,  # 高さを少し小さく
        )

        return fig

    # タグ検索（見かけだけ）
    color_tag_palette = [
        ("赤", "danger"),
        ("青", "primary"),
        ("緑", "success"),
        ("黄", "warning"),
        ("紫", "secondary"),
        ("黒", "dark"),
        ("白", "light"),
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
                        color=color,
                        className=(
                            "me-2 mb-2" + (" text-dark" if color == "light" else "")
                        ),
                    )
                    for name, color in color_tag_palette
                ],
                className="mt-2",
            ),
        ],
        className="card text-white bg-secondary mb-3",
    )

    if real_products_count == 0:
        # ギャラリーコンテンツ（写真がない場合）
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
                    value="thumb",
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
                                                html.Div(
                                                    [
                                                        *[
                                                            dbc.Badge(
                                                                n,
                                                                color=c,
                                                                className=(
                                                                    "me-1"
                                                                    + (
                                                                        " text-dark"
                                                                        if c == "light"
                                                                        else ""
                                                                    )
                                                                ),
                                                            )
                                                            for n, c in (
                                                                [
                                                                    color_tag_palette[
                                                                        (i * 2)
                                                                        % len(
                                                                            color_tag_palette
                                                                        )
                                                                    ],
                                                                    color_tag_palette[
                                                                        (i * 2 + 1)
                                                                        % len(
                                                                            color_tag_palette
                                                                        )
                                                                    ],
                                                                ]
                                                            )
                                                        ]
                                                    ],
                                                    className="mt-1",
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
                    id={"type": "gallery-thumb", "index": _photo_unique_id(photo, f"photo-{i}")},
                    className="list-group-item list-group-item-action d-flex align-items-center gap-3",
                    n_clicks=0,
                )
                for i, photo in enumerate(real_photos_for_store)
            ],
            className="list-group mb-4",
            id="gallery-list-wrapper",
        )
        detail_panel = html.Div(
            [
                html.H4("写真の詳細", className="mb-3"),
                html.Div(
                    "サムネイルをクリックすると詳細を表示します。",
                    id="gallery-detail-content",
                    className="text-muted",
                ),
            ],
            className="card p-4 mb-4",
        )
        dashboard_content = html.Div(
            [
                photo_store_component,
                tag_search,
                summary,
                view_toggle,
                html.Div(grid, id="gallery-grid-wrapper"),
                list_view,
                detail_panel,
            ]
        )

    return html.Div([header, dashboard_content])


@callback(
    Output("gallery-grid-wrapper", "style"),
    Output("gallery-list-wrapper", "style"),
    Input("gallery-view-mode", "value"),
)
def _toggle_gallery_view(mode: str):
    # 初回/不正値でも安全に
    mode = mode or "thumb"
    if mode == "list":
        return {"display": "none"}, {"display": "block"}
    return {"display": "block"}, {"display": "none"}


@callback(
    Output("gallery-detail-content", "children"),
    Input({"type": "gallery-thumb", "index": ALL}, "n_clicks"),
    State("gallery-photo-data", "data"),
    prevent_initial_call=True,
)
def _show_photo_detail(_, stored_photos):
    ctx = callback_context
    if not ctx.triggered:
        raise PreventUpdate

    triggered = ctx.triggered_id
    if not isinstance(triggered, dict):
        raise PreventUpdate

    target_index = str(triggered.get("index"))
    if not stored_photos:
        raise PreventUpdate

    for photo in stored_photos:
        unique = str(
            _photo_unique_id(photo, photo.get("registration_product_id") or "")
        )
        if unique == target_index:
            return _render_detail_content(photo)

    return html.Div("詳細データを取得できませんでした。", className="text-danger")


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
