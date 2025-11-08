from dash import html, dcc
import dash_bootstrap_components as dbc


def render_settings(total_photos: int, current_theme: str = "minty") -> html.Div:
    return html.Div(
        [
            html.Div([html.H1([html.I(className="bi bi-gear me-2"), "設定"])], className="header"),
            html.Div(
                [
                    html.H4(
                        "アプリ情報",
                        className="card-title",
                    ),
                    html.P(
                        [html.Strong("バージョン: "), "1.0.0"],
                        className="card-text mb-2",
                    ),
                    html.P(
                        [html.Strong("登録写真数: "), f"{total_photos} 枚"],
                        className="card-text mb-0",
                    ),
                    html.Div(
                        [
                            html.Span("データ提供: ", className="me-2"),
                            html.A(
                                html.Img(
                                    src="https://webservice.rakuten.co.jp/img/credit/200709/credit_22121.gif",
                                    alt="Rakuten Web Service Center",
                                    title="Rakuten Web Service Center",
                                    width="221",
                                    height="21",
                                    style={"border": "0"},
                                ),
                                href="https://webservice.rakuten.co.jp/",
                                target="_blank",
                                rel="noopener noreferrer",
                            ),
                        ],
                        className="mt-3 d-inline-flex align-items-center gap-2",
                    ),
                ],
                className="card text-white bg-primary mb-3",
            ),
            html.Div(
                [
                    html.H4(
                        "テーマ設定",
                        className="card-title",
                    ),
                    html.P(
                        "アプリの見た目を変更できます。変更後はページをリロードしてください。",
                        className="card-text mb-3",
                    ),
                    dbc.Select(
                        id="theme-selector",
                        options=[
                            {"label": theme.title(), "value": theme}
                            for theme in [
                                "cerulean",
                                "cosmo",
                                "cyborg",
                                "darkly",
                                "flatly",
                                "journal",
                                "litera",
                                "lumen",
                                "lux",
                                "materia",
                                "minty",
                                "morph",
                                "pulse",
                                "quartz",
                                "sandstone",
                                "simplex",
                                "sketchy",
                                "slate",
                                "solar",
                                "spacelab",
                                "superhero",
                                "united",
                                "vapor",
                                "yeti",
                                "zephyr",
                            ]
                        ],
                        value=current_theme,
                        className="mb-3",
                    ),
                    html.Button(
                        "テーマを保存",
                        id="save-theme-button",
                        n_clicks=0,
                        className="btn btn-light",
                    ),
                    html.Div(id="theme-save-result", className="mt-3"),
                ],
                className="card text-white bg-primary mb-3",
            ),
            html.Div(
                [
                    html.H4(
                        "タグ設定",
                        className="card-title",
                    ),
                    html.Div(
                        [
                            html.Button(
                                "カラータグ",
                                n_clicks=0,
                                className="btn btn-light me-2 mb-2",
                            ),
                            html.Button(
                                "カテゴリータグ",
                                n_clicks=0,
                                className="btn btn-light me-2 mb-2",
                            ),
                            html.Button(
                                "収納場所タグ",
                                n_clicks=0,
                                className="btn btn-light mb-2",
                            ),
                        ]
                    ),
                ],
                className="card text-white bg-secondary mb-3",
            ),
            html.Div(
                [
                    html.H4(
                        "SNS共有用文 設定",
                        className="card-title",
                    ),
                    html.Div(
                        [
                            html.Button(
                                "X用",
                                n_clicks=0,
                                className="btn btn-light me-2 mb-2",
                                id="btn-x-share",
                            ),
                            html.Button(
                                "Instagram用",
                                n_clicks=0,
                                className="btn btn-light me-2 mb-2",
                            ),
                            html.Button(
                                "LINE用",
                                n_clicks=0,
                                className="btn btn-light mb-2",
                            ),
                        ]
                    ),
                    html.Div(
                        id="x-share-config",
                        style={"display": "none"},
                        children=[
                            dcc.Textarea(
                                id="x-share-textarea",
                                placeholder="X用の共有文を入力（目安: 280文字）",
                                style={"width": "100%", "minHeight": "120px"},
                                className="form-control",
                            ),
                            html.Div(
                                id="x-share-count",
                                className="small text-white-50 mt-1",
                                children="文字数: 0/280",
                            ),
                            html.Button(
                                "設定",
                                id="x-share-save-dummy",
                                n_clicks=0,
                                className="btn btn-light mt-2",
                            ),
                        ],
                    ),
                ],
                className="card text-white bg-secondary mb-3",
            ),
            html.Div(
                [
                    html.H4(
                        "データ管理",
                        className="card-title",
                    ),
                    html.Button(
                        "全てのデータを削除",
                        id="delete-all-button",
                        n_clicks=0,
                        className="btn btn-danger",
                    ),
                    html.Div(id="delete-result", className="mt-3"),
                ],
                className="card text-white bg-secondary mb-3",
            ),
            html.Div(
                [
                    html.H4(
                        "使い方",
                        className="card-title",
                    ),
                    html.P(
                        "このアプリは、商品のバーコードをスキャンして写真を管理するためのアプリです。",
                        className="card-text mb-3",
                    ),
                    html.P(
                        "写真をアップロードすると、自動的にバーコードを検出して登録します。",
                        className="card-text mb-0",
                    ),
                ],
                className="card text-white bg-primary mb-3",
            ),
        ]
    )
