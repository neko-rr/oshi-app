from dash import html
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
