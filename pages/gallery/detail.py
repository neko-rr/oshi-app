from urllib.parse import parse_qs

from dash import html, dcc, register_page, callback, Input, Output, State, no_update
from dash.exceptions import PreventUpdate

from services.supabase_client import get_supabase_client


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
        className="card p-4 mb-4",
    )


def _render_detail_card(record: dict, back_view: str) -> html.Div:
    photo = record.get("photo") or {}
    thumb = (
        photo.get("photo_high_resolution_url")
        or photo.get("photo_thumbnail_url")
        or record.get("photo_thumbnail_url")
        or record.get("photo_high_resolution_url")
    )

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
        className="card p-4 mb-4",
    )


def render_detail_page(search: str) -> html.Div:
    pid, view = _read_query(search)
    if not pid:
        return _render_error("registration_product_id が指定されていません。")

    supabase = get_supabase_client()
    if supabase is None:
        return _render_error("データ取得に失敗しました（Supabase 未設定）。")

    try:
        res = (
            supabase.table("registration_product_information")
            .select(
                """
                *,
                photo(
                    photo_thumbnail_url,
                    photo_high_resolution_url,
                    front_flag,
                    photo_theme_color
                )
                """
            )
            .eq("registration_product_id", pid)
            .limit(1)
            .execute()
        )
        data = res.data if hasattr(res, "data") else []
        if not data:
            return _render_error("指定されたデータが見つかりませんでした。")
        record = data[0]
    except Exception as e:
        return _render_error(f"データ取得に失敗しました: {e}")

    return _render_detail_card(record, back_view=view)


@callback(
    Output("gallery-detail-root", "children"),
    Input("_pages_location", "search"),
)
def _on_query_change(search):
    if search is None:
        raise PreventUpdate
    return render_detail_page(search)


register_page(
    __name__,
    path="/gallery/detail",
    title="写真の詳細 - ギャラリー",
)

try:
    layout = html.Div([dcc.Location(id="gallery-detail-location"), html.Div(id="gallery-detail-root")])
except Exception as e:
    layout = html.Div(
        f"Gallery detail page error: {str(e)}", style={"color": "red", "padding": "20px"}
    )


