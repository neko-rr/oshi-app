from dash import dcc, html


def render_barcode_section() -> html.Div:
    return html.Div(
        [
            html.Div(
                [
                    html.H3(
                        "バーコードをカメラで読み取る", className="section-subtitle"
                    ),
                    html.P(
                        "カメラを起動し、バーコードが画面内ではっきり写るように撮影してください。",
                        className="section-description",
                    ),
                    html.Button(
                        [
                            html.Div("📷", className="camera-icon"),
                            html.Div("カメラを起動", className="camera-label"),
                        ],
                        id="barcode-camera-start",
                        className="camera-button",
                        **{
                            "data-camera-group": "barcode",
                            "data-camera-role": "start",
                            "data-camera-upload-id": "barcode-camera-upload",
                        },
                    ),
                    html.Video(
                        id="barcode-camera-video",
                        autoPlay=True,
                        muted=True,
                        className="camera-preview",
                        **{
                            "data-camera-group": "barcode",
                            "data-camera-role": "video",
                            "data-camera-upload-id": "barcode-camera-upload",
                        },
                    ),
                    html.Canvas(
                        id="barcode-camera-canvas",
                        style={"display": "none"},
                        **{
                            "data-camera-group": "barcode",
                            "data-camera-role": "canvas",
                            "data-camera-upload-id": "barcode-camera-upload",
                        },
                    ),
                    html.Div(
                        [
                            html.Button(
                                "📸 撮影",
                                id="barcode-camera-capture",
                                className="btn-custom",
                                **{
                                    "data-camera-group": "barcode",
                                    "data-camera-role": "capture",
                                    "data-camera-upload-id": "barcode-camera-upload",
                                },
                                style={"display": "none"},
                            ),
                            html.Button(
                                "❌ キャンセル",
                                id="barcode-camera-cancel",
                                className="btn-secondary",
                                **{
                                    "data-camera-group": "barcode",
                                    "data-camera-role": "cancel",
                                    "data-camera-upload-id": "barcode-camera-upload",
                                },
                                style={"display": "none"},
                            ),
                        ],
                        className="step-actions",
                    ),
                    dcc.Upload(
                        id="barcode-camera-upload",
                        children=html.Div(),
                        style={"display": "none"},
                        multiple=False,
                    ),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.H3(
                        "バーコード画像をアップロード", className="section-subtitle"
                    ),
                    html.P(
                        "撮影済みの写真がある場合はこちらからアップロードしてください。",
                        className="section-description",
                    ),
                    dcc.Upload(
                        id="barcode-upload",
                        children=html.Div(
                            [
                                html.Div("📁", className="upload-icon"),
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
                    html.H3("バーコード番号を手入力", className="section-subtitle"),
                    html.P(
                        "バーコードが読めない場合は、番号を直接入力してください。",
                        className="section-description",
                    ),
                    html.Div(
                        [
                            dcc.Input(
                                id="barcode-manual-input",
                                type="text",
                                placeholder="例: 4901234567894",
                                className="input-custom",
                            ),
                            html.Button(
                                "番号を登録",
                                id="barcode-manual-submit",
                                className="btn-custom",
                            ),
                        ],
                        className="manual-input-group",
                    ),
                    html.Button(
                        "情報を全て手動入力する",
                        id="barcode-manual-mode",
                        className="btn-link",
                    ),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.Button(
                        "もう一度挑戦する",
                        id="barcode-retry-button",
                        className="btn-secondary",
                    ),
                    html.Button(
                        "バーコードをスキップ",
                        id="barcode-skip-button",
                        className="btn-secondary",
                    ),
                ],
                className="step-actions",
            ),
        ]
    )
