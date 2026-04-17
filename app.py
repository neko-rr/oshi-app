import dash
from dash import Input, Output, State, html, dcc, no_update
from dash.exceptions import PreventUpdate
from copy import deepcopy

from components.theme_utils import load_theme, get_bootswatch_css
from components.layout import _build_navigation
from components.state_utils import empty_registration_state
from services.supabase_client import get_supabase_client
from services.debug_log import dash_debug_print

# Load environment variables EARLY so services read correct .env (models, flags)
try:
    import os
    from dotenv import load_dotenv

    project_root = os.path.dirname(os.path.abspath(__file__))
    dotenv_path = os.path.join(project_root, ".env")
    load_dotenv(dotenv_path=dotenv_path, override=False)
    dash_debug_print("DEBUG: Early .env loaded before services imports")
except Exception as _early_env_err:
    dash_debug_print(f"DEBUG: Early .env load skipped: {_early_env_err}")


# UIレンダリング関数は components/ui_components.py に移動


# _update_tags関数は services/tag_service.py に移動


# テーマ関連処理は components/theme_utils.py に移動


def create_app(server=None) -> dash.Dash:
    app = dash.Dash(
        __name__,
        server=server,
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
    from features.color_tag.controller import register_color_tag_callbacks

    register_barcode_callbacks(app)
    register_photo_callbacks(app)
    register_x_share_callbacks(app)
    register_review_callbacks(app)
    register_theme_callbacks(app)
    register_color_tag_callbacks(app)

    # /register/barcode に外部から入ったときだけ registration-store を初期化し、
    # ページ遷移ごとにテーマ href を同期（pathname 入力は1本化して POST を削減）
    @app.callback(
        [
            Output("nav-history-store", "data"),
            Output("registration-store", "data", allow_duplicate=True),
            Output("bootswatch-theme", "href", allow_duplicate=True),
        ],
        Input("_pages_location", "pathname"),
        State("nav-history-store", "data"),
        prevent_initial_call=False,
    )
    def _sync_nav_store_and_theme(pathname, history):
        prev_path = None
        if isinstance(history, dict):
            prev_path = history.get("prev")

        reset_needed = pathname == "/register/barcode" and (
            not prev_path or not str(prev_path).startswith("/register")
        )

        theme = load_theme()
        href = get_bootswatch_css(theme)

        if reset_needed:
            return {"prev": pathname}, deepcopy(empty_registration_state()), href

        return {"prev": pathname}, no_update, href

    # レイアウト設定（page_container を中央寄せ＆最大幅でラップ）
    app.layout = html.Div(
        [
            html.Link(
                rel="stylesheet",
                href=get_bootswatch_css(load_theme()),
                id="bootswatch-theme",
            ),
            dcc.Store(id="theme-store", storage_type="local"),
            html.Div(
                dash.page_container, className="page-container"
            ),  # ページ内容を中央寄せ＋最大幅でラップ
            _build_navigation(),  # 共通ナビ
            dcc.Store(
                id="registration-store", data=deepcopy(empty_registration_state())
            ),
            dcc.Store(id="nav-history-store", data={"prev": None}),
            html.Div(id="auto-fill-trigger", style={"display": "none"}),
        ]
    )

    # /register のみ /register/select へ（サーバー往復なし・固定パス）
    app.clientside_callback(
        """
        function(pathname) {
            if (pathname === "/register") {
                return "/register/select";
            }
            return window.dash_clientside.no_update;
        }
        """,
        Output("_pages_location", "pathname", allow_duplicate=True),
        Input("_pages_location", "pathname"),
    )

    return app


if __name__ == "__main__":
    import os

    app = create_app()
    server = app.server
    port = int(os.environ.get("PORT", 8050))
    app.run(host="0.0.0.0", port=port)
