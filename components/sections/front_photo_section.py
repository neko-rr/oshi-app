from dash import html, dcc


def render_front_photo_section() -> html.Div:
    return html.Div(
        [
            html.Div(
                [
                    html.H3("正面写真をカメラで撮影", className="section-subtitle"),
                    html.P(
                        "グッズの正面が中央に入るように、明るい場所で撮影してください。",
                        className="section-description",
                    ),
                    html.Button(
                        [
                            html.Div([html.I(className="bi bi-camera-video")], className="camera-icon"),
                            html.Div("カメラを起動", className="camera-label"),
                        ],
                        id="front-camera-start",
                        className="camera-button",
                        **{
                            "data-camera-group": "front",
                            "data-camera-role": "start",
                            "data-camera-upload-id": "front-camera-upload",
                        },
                    ),
                    html.Video(
                        id="front-camera-video",
                        autoPlay=True,
                        muted=True,
                        className="camera-preview",
                        **{
                            "data-camera-group": "front",
                            "data-camera-role": "video",
                            "data-camera-upload-id": "front-camera-upload",
                        },
                    ),
                    html.Canvas(
                        id="front-camera-canvas",
                        style={"display": "none"},
                        **{
                            "data-camera-group": "front",
                            "data-camera-role": "canvas",
                            "data-camera-upload-id": "front-camera-upload",
                        },
                    ),
                    html.Div(
                        [
                            html.Button(
                                [html.I(className="bi bi-camera me-1"), "撮影"],
                                id="front-camera-capture",
                                className="btn btn-primary",
                                **{
                                    "data-camera-group": "front",
                                    "data-camera-role": "capture",
                                    "data-camera-upload-id": "front-camera-upload",
                                },
                                style={"display": "none"},
                            ),
                            html.Button(
                                [html.I(className="bi bi-x-circle me-1"), "キャンセル"],
                                id="front-camera-cancel",
                                className="btn btn-outline-secondary",
                                **{
                                    "data-camera-group": "front",
                                    "data-camera-role": "cancel",
                                    "data-camera-upload-id": "front-camera-upload",
                                },
                                style={"display": "none"},
                            ),
                        ],
                        className="step-actions",
                    ),
                    dcc.Upload(
                        id="front-camera-upload",
                        children=html.Div(),
                        style={"display": "none"},
                        multiple=False,
                    ),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.H3("正面写真をアップロード", className="section-subtitle"),
                    html.P(
                        "撮影済みの写真がある場合はこちらからアップロードしてください。",
                        className="section-description",
                    ),
                    dcc.Upload(
                        id="front-upload",
                        children=html.Div(
                            [
                                html.Div([html.I(className="bi bi-image")], className="upload-icon"),
                                html.Div("ファイルから選択", className="upload-label"),
                            ]
                        ),
                        className="upload-area",
                        multiple=False,
                    ),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.Button(
                        "正面写真をスキップ",
                        id="front-skip-button",
                        className="btn btn-outline-secondary",
                    ),
                ],
                className="step-actions",
            ),
        ]
    )
