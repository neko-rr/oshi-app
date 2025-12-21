import dash
from dash import Input, Output, State, html, dcc
from dash.exceptions import PreventUpdate
from copy import deepcopy

from components.theme_utils import load_theme, get_bootswatch_css
from components.layout import _build_navigation
from components.state_utils import empty_registration_state
from services.supabase_client import get_supabase_client

# Load environment variables EARLY so services read correct .env (models, flags)
try:
    from dotenv import load_dotenv

    load_dotenv()
    print("DEBUG: Early .env loaded before services imports")
except Exception as _early_env_err:
    print(f"DEBUG: Early .env load skipped: {_early_env_err}")

supabase = get_supabase_client()


# UIレンダリング関数は components/ui_components.py に移動


# _update_tags関数は services/tag_service.py に移動


# テーマ関連処理は components/theme_utils.py に移動


def create_app() -> dash.Dash:
    app = dash.Dash(
        __name__,
        suppress_callback_exceptions=True,
        use_pages=True,
        # allow_duplicate を使うコールバックがあるため initial_duplicate を指定
        prevent_initial_callbacks="initial_duplicate",  # type: ignore[arg-type]
        meta_tags=[
            {
                "name": "viewport",
                "content": "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
            }
        ],
        external_stylesheets=[
            "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
        ],
    )
    app.title = "推し活グッズ管理"

    # 機能別コールバック登録
    from features.barcode.controller import register_barcode_callbacks
    from features.photo.controller import (
        register_photo_callbacks,
        register_x_share_callbacks,
    )
    from features.review.controller import register_review_callbacks
    from components.theme_utils import register_theme_callbacks

    register_barcode_callbacks(app)
    register_photo_callbacks(app)
    register_x_share_callbacks(app)
    register_review_callbacks(app)
    register_theme_callbacks(app)

    # /register への直接アクセスを /register/barcode にリダイレクト
    @app.callback(
        Output("nav-redirect", "pathname", allow_duplicate=True),
        Input("_pages_location", "pathname"),
    )
    def _redirect_register(pathname):
        if pathname == "/register":
            return "/register/barcode"
        if pathname == "/register/barcode":
            raise PreventUpdate
        raise PreventUpdate

    # registration-store の状態に応じて自動遷移（初回アクセスも発火）
    @app.callback(
        Output("nav-redirect", "pathname", allow_duplicate=True),
        Input("registration-store", "data"),
        prevent_initial_call=False,
    )
    def _auto_nav_from_store(store_data):
        if not store_data:
            raise PreventUpdate
        barcode_status = store_data.get("barcode", {}).get("status")
        photo_status = store_data.get("front_photo", {}).get("status")

        # STEP1 -> STEP2
        if barcode_status in {"captured", "manual", "skipped"}:
            return "/register/photo"

        # STEP2 -> STEP3
        if photo_status in {"captured", "skipped"}:
            return "/register/review"

        raise PreventUpdate

    # レイアウト設定（page_container を中央寄せ＆最大幅でラップ）
    app.layout = html.Div(
        [
            html.Link(
                rel="stylesheet",
                href=get_bootswatch_css(load_theme()),
                id="bootswatch-theme",
            ),
            dcc.Location(id="nav-redirect", refresh=False),  # 独自遷移用
            html.Div(
                dash.page_container, className="page-container"
            ),  # ページ内容を中央寄せ＋最大幅でラップ
            _build_navigation(),  # 共通ナビ
            dcc.Store(
                id="registration-store", data=deepcopy(empty_registration_state())
            ),
            html.Div(id="auto-fill-trigger", style={"display": "none"}),
        ]
    )

    return app


app = create_app()
server = app.server


if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 8050))
    app.run(host="0.0.0.0", port=port)
