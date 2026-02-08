from dash import html, register_page
from services.photo_service import (
    get_product_stats,
    get_random_product_with_photo,
)
from services.supabase_client import get_supabase_client


def render_home() -> html.Div:
    supabase = get_supabase_client()
    stats = get_product_stats(supabase)
    total_registrations = stats.get("total") or 0
    total_photos = stats.get("total_photos") or stats.get("total") or 0
    unique_barcodes = stats.get("unique_barcodes") or stats.get("unique") or 0

    random_product = (
        get_random_product_with_photo(supabase) if supabase is not None else None
    )

    def _random_photo_card():
        if not random_product:
            return html.Div(
                [
                    html.Div(
                        "まだ写真付きの登録がありません。", className="text-muted"
                    ),
                    html.A(
                        "写真を登録する",
                        href="/register/barcode",
                        className="btn btn-primary btn-sm mt-2",
                    ),
                ],
                className="card p-3",
            )

        photo = random_product.get("photo") or {}
        img_url = photo.get("photo_thumbnail_url") or photo.get(
            "photo_high_resolution_url"
        )
        product_name = random_product.get("product_name") or "名称未設定"
        barcode = random_product.get("barcode_number") or "未取得"

        return html.Div(
            [
                html.Div("ランダムに1件表示中", className="text-muted small mb-2"),
                html.Div(
                    [
                        html.Img(
                            src=img_url,
                            style={
                                "width": "100%",
                                "height": "220px",
                                "objectFit": "cover",
                                "borderRadius": "12px",
                            },
                        )
                        if img_url
                        else html.Div(
                            [
                                html.I(
                                    className="bi bi-image",
                                    style={"fontSize": "32px"},
                                ),
                                html.Div("画像URLがありません", className="text-muted"),
                            ],
                            className="d-flex flex-column align-items-center justify-content-center",
                            style={
                                "height": "220px",
                                "background": "var(--bs-secondary-bg)",
                                "borderRadius": "12px",
                            },
                        ),
                        html.Div(
                            [
                                html.H5(product_name, className="mb-1"),
                                html.Div(
                                    f"バーコード: {barcode}", className="text-muted"
                                ),
                            ],
                            className="mt-2",
                        ),
                        html.A(
                            "ギャラリーで見る",
                            href="/gallery",
                            className="btn btn-outline-primary btn-sm mt-3",
                        ),
                    ],
                    className="card-body",
                ),
                html.Div(
                    f"登録ID: {random_product.get('registration_product_id')}",
                    className="text-muted small ps-3 pb-3",
                ),
            ],
            className="card",
        )

    return html.Div(
        [
            html.Div(
                [
                    html.H1([html.I(className="bi bi-camera me-2"), "写真管理"]),
                    html.P(
                        "バーコードで写真を管理",
                        className="text-muted mb-0",
                    ),
                ],
                className="header",
            ),
            html.Div(
                [
                    html.H3(
                        "ようこそ",
                        className="card-title",
                    ),
                    html.P(
                        "バーコードをスキャンして写真を簡単に管理できます。",
                        className="card-text",
                    ),
                ],
                className="card bg-primary text-white mb-3",
            ),
            html.Div(
                [
                    html.Div(
                        [
                            html.Div(
                                [
                                    html.Div(
                                        str(total_registrations),
                                        className="stat-number",
                                    ),
                                    html.Div("全登録数", className="stat-label"),
                                ],
                                className="stat-box",
                            ),
                            html.Div(
                                [
                                    html.Div(
                                        str(total_photos), className="stat-number"
                                    ),
                                    html.Div("登録済み写真", className="stat-label"),
                                ],
                                className="stat-box",
                            ),
                            html.Div(
                                [
                                    html.Div(
                                        str(unique_barcodes), className="stat-number"
                                    ),
                                    html.Div(
                                        "ユニークなバーコード", className="stat-label"
                                    ),
                                ],
                                className="stat-box",
                            ),
                        ],
                        className="d-flex justify-content-around gap-3 mb-4",
                    ),
                ],
                className="card bg-light p-3",
            ),
            # ランダム1件の写真表示
            html.Div(
                [
                    html.H4("登録済みの写真からランダムに1枚", className="card-title"),
                    _random_photo_card(),
                ],
                className="card bg-light p-3 mb-3",
            ),
        ]
    )


register_page(
    __name__,
    path="/",
    title="ホーム - おしごとアプリ",
)

def layout():
    try:
        return render_home()
    except Exception as e:
        return html.Div(
            f"Home page error: {str(e)}", style={"color": "red", "padding": "20px"}
        )
