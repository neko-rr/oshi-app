import dash
from dash import Input, Output, html, dcc
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
server = app.server
app.title = "推し活グッズ管理"


# serve_layout関数は削除（pages機能では不要）


# ページ切り替えコールバックはDash pages機能により不要


# Xシェアコールバックは features/photo/controller.py に移動
def toggle_x_share(n_clicks, text_value):
    # Show config after first click; keep visible afterwards
    visible = {"display": "block"} if (n_clicks or 0) > 0 else {"display": "none"}
    length = len(text_value) if text_value else 0
    return visible, f"文字数: {length}/280"


# バーコード関連コールバックは features/barcode/controller.py に移動


# 古いprocess_tags関数は削除（インターバルベースに変更）


# render_tag_feedbackコールバックは features/review/controller.py に移動


# 写真関連コールバックは features/photo/controller.py に移動


# 写真アップロード後のページ遷移
# auto_navigate_on_photo_uploadコールバックは features/photo/controller.py に移動


# toggle_save_buttonコールバックは features/review/controller.py に移動


# sync_tag_checklistコールバックは features/review/controller.py に移動


# add_custom_tagコールバックは features/review/controller.py に移動


# レビュー関連コールバックは features/review/controller.py に移動


# update_photo_thumbnailは features/review/controller.py に移動


# process_tagsは features/review/controller.py に移動


# trigger_auto_fill_on_page_changeコールバックは features/review/controller.py に移動


# auto_fill_form_from_tagsコールバックは features/review/controller.py に移動


# display_api_resultsコールバックは features/review/controller.py に移動


# save_registration関数は services/registration_service.py に移動


# テーマ関連コールバックは components/theme_utils.py に移動


if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 8050))

    # .envファイルから環境変数を読み込む
    try:
        from dotenv import load_dotenv

        load_dotenv()
        print("DEBUG: Loaded environment variables from .env file")
    except ImportError:
        print("DEBUG: python-dotenv not available, using system environment variables")

    # テスト: IO Intelligence APIキーの確認
    import os

    # 環境変数が設定されていない場合のみテスト用キーを設定
    current_key = os.getenv("IO_INTELLIGENCE_API_KEY")
    if not current_key:
        os.environ["IO_INTELLIGENCE_API_KEY"] = "test_key_for_debugging"
        print("DEBUG: Set test IO_INTELLIGENCE_API_KEY for debugging")
    else:
        print(
            f"DEBUG: Using existing IO_INTELLIGENCE_API_KEY (length: {len(current_key)})"
        )

    from services.io_intelligence import IO_API_KEY

    print(f"DEBUG: IO_API_KEY is set: {bool(IO_API_KEY)}")
    if IO_API_KEY:
        print(f"DEBUG: IO_API_KEY length: {len(IO_API_KEY)}")
        print(
            f"DEBUG: IO_API_KEY starts with: {IO_API_KEY[:10] if IO_API_KEY else 'None'}..."
        )

        # 本番では起動時のdescribe_imageテスト呼び出しは行わない
    else:
        print("DEBUG: IO_API_KEY is still not set - this should not happen")

    # 機能別controllerの登録
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
        prevent_initial_call=True,
    )
    def _redirect_register(pathname):
        if pathname == "/register":
            return "/register/barcode"
        raise PreventUpdate

    # Dash Pages推奨: page_container に任せ、Location はPages側を使用
    app.layout = html.Div(
        [
            html.Link(
                rel="stylesheet",
                href=get_bootswatch_css(load_theme()),
                id="bootswatch-theme",
            ),
            dcc.Location(id="nav-redirect", refresh=False),  # 独自遷移用
            dash.page_container,  # ページ内容は Pages 側が挿入
            _build_navigation(),  # 共通ナビ
            dcc.Store(
                id="registration-store", data=deepcopy(empty_registration_state())
            ),
            html.Div(id="auto-fill-trigger", style={"display": "none"}),
        ]
    )

    app.run(host="0.0.0.0", port=port)
