from dash import html, dcc


def render_home(total_photos: int, unique_barcodes: int) -> html.Div:
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
            # タグ検索（見かけのみ）
            html.Div(
                [
                    html.H4("タグ検索", className="card-title"),
                    html.Div(
                        [
                            dcc.Input(
                                placeholder="タグで検索（例: 猫、白、キーホルダー）",
                                className="form-control me-2",
                                style={"maxWidth": "420px"},
                            ),
                            html.Button("検索", className="btn btn-light mt-2 mt-md-0"),
                        ],
                        className="d-flex flex-column flex-md-row align-items-start",
                    ),
                ],
                className="card text-white bg-secondary mb-3",
            ),
            # 画像一覧（見かけのみのサムネイル）
            html.Div(
                [
                    html.H4("最近の写真", className="card-title mb-3"),
                    html.Div(
                        [
                            *[
                                html.Div(
                                    [
                                        html.Div(
                                            [
                                                html.I(
                                                    className="bi bi-image",
                                                    style={"fontSize": "28px"},
                                                )
                                            ],
                                            className="d-flex align-items-center justify-content-center",
                                            style={
                                                "height": "150px",
                                                "background": "var(--bs-secondary-bg)",
                                            },
                                        ),
                                        html.Div(
                                            [
                                                html.Span("タグ: ", className="text-muted me-1"),
                                                html.Span("猫", className="badge bg-light text-dark me-1"),
                                                html.Span("白", className="badge bg-light text-dark me-1"),
                                                html.Span("キーホルダー", className="badge bg-light text-dark"),
                                            ],
                                            className="photo-info",
                                        ),
                                    ],
                                    className="photo-card",
                                )
                                for _ in range(12)
                            ]
                        ],
                        className="photo-grid",
                    ),
                ],
                className="card bg-light p-3 mb-3",
            ),
        ]
    )
