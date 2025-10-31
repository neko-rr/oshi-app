from copy import deepcopy
from dash import dcc, html

NAV_ITEMS = [
    {"href": "/", "label": "ホーム", "icon": "bi-house", "id": "nav-home"},
    {"href": "/register", "label": "写真を登録", "icon": "bi-camera", "id": "nav-register"},
    {"href": "/gallery", "label": "ダッシュボード", "icon": "bi-speedometer2", "id": "nav-gallery"},
    {"href": "/settings", "label": "設定", "icon": "bi-gear", "id": "nav-settings"},
]

DEFAULT_REGISTRATION_STATE = {
    "barcode": {
        "value": None,
        "type": None,
        "status": "idle",
        "source": None,
        "filename": None,
    },
    "front_photo": {
        "content": None,
        "filename": None,
        "content_type": None,
        "status": "idle",
        "description": None,
    },
    "lookup": {
        "status": "idle",
        "items": [],
        "message": "",
        "source": None,
        "keyword": None,
    },
    "tags": {
        "status": "idle",
        "tags": [],
        "message": "",
    },
}


def _build_navigation():
    return html.Nav(
        html.Div(
            [
                html.A(
                    [
                        html.I(className=f"bi {item['icon']}"),
                        html.Div(item["label"], className="nav-label"),
                    ],
                    href=item["href"],
                    className="nav-link text-white-50",
                    id=item["id"],
                )
                for item in NAV_ITEMS
            ],
            className="navbar-nav flex-row justify-content-around w-100",
        ),
        className="navbar navbar-dark bg-primary",
    )


def create_app_layout(theme_href: str):
    """Return the root Dash layout."""
    return html.Div(
        [
            html.Link(rel="stylesheet", href=theme_href, id="bootswatch-theme"),
            dcc.Location(id="url", refresh=False),
            html.Div(id="page-content", className="page-container"),
            _build_navigation(),
            dcc.Store(
                id="registration-store",
                data=deepcopy(DEFAULT_REGISTRATION_STATE),
            ),
            html.Div(id="auto-fill-trigger", style={"display": "none"}),  # 自動反映トリガー用
        ]
    )
