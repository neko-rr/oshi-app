# Available Bootswatch themes
from typing import Optional

from services.theme_service import (
    DEFAULT_THEME,
    DEFAULT_MEMBERS_TYPE_NAME,
    get_theme,
    set_theme,
)

try:
    from flask import g, has_app_context
except Exception:  # pragma: no cover
    g = None

    def has_app_context() -> bool:  # type: ignore
        return False

BOOTSWATCH_THEMES = [
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

# Load/save theme (ローカルフォールバック用)
THEME_FILE = "theme.txt"


def _load_theme_from_file() -> str:
    try:
        with open(THEME_FILE, "r") as f:
            theme = f.read().strip()
            if theme in BOOTSWATCH_THEMES:
                return theme
    except FileNotFoundError:
        pass
    return DEFAULT_THEME


def _save_theme_to_file(theme: str):
    try:
        with open(THEME_FILE, "w") as f:
            f.write(theme)
    except Exception as exc:
        print(f"DEBUG: save_theme_to_file failed: {exc}")


def _infer_members_id(members_id: Optional[str]) -> Optional[str]:
    if members_id:
        return members_id

    # アプリコンテキストが無い（起動時など）場合は g に触れない
    if g is None or not has_app_context():
        return None

    uid = getattr(g, "user_id", None)
    if uid:
        return str(uid)
    return None


def load_theme(
    members_id: Optional[str] = None, members_type_name: Optional[str] = None
) -> str:
    """Supabase 優先でテーマ取得。未設定/失敗時はローカル→デフォルト minty。"""
    mid = _infer_members_id(members_id)
    mtype = members_type_name or DEFAULT_MEMBERS_TYPE_NAME
    if mid:
        theme = get_theme(mid, mtype)
        if theme:
            return theme
    return _load_theme_from_file()


def save_theme(
    theme: str,
    members_id: Optional[str] = None,
    members_type_name: Optional[str] = None,
) -> None:
    """Supabase に保存し、失敗時はローカルファイルにフォールバック。"""
    mid = _infer_members_id(members_id)
    mtype = members_type_name or DEFAULT_MEMBERS_TYPE_NAME
    saved = False
    if mid:
        saved = set_theme(theme, mid, mtype)
    if not saved:
        _save_theme_to_file(theme)


# Current theme（初期値はデフォルトのみ、DBアクセスは行わない）
CURRENT_THEME = DEFAULT_THEME


def get_bootswatch_css(theme: str) -> str:
    """Get Bootswatch CSS URL for the given theme."""
    return (
        f"https://cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/{theme}/bootstrap.min.css"
    )


# Theme management callbacks
def register_theme_callbacks(app):
    from dash import (
        Input,
        Output,
        State,
        html,
        callback_context,
        ALL,
        ClientsideFunction,
    )
    from dash.exceptions import PreventUpdate

    @app.callback(
        Output("theme-save-result", "children", allow_duplicate=True),
        Input("save-theme-button", "n_clicks"),
        State("theme-preview-store", "data"),
        prevent_initial_call="initial_duplicate",
    )
    def save_theme_callback(n_clicks, selected_theme):
        if not n_clicks or not selected_theme:
            return ""

        try:
            save_theme(selected_theme)
            return (
                html.Div(
                    f"テーマ '{selected_theme}' を保存しました。",
                    className="alert alert-success",
                ),
                get_bootswatch_css(selected_theme),
            )
        except Exception as e:
            return (
                html.Div(
                    f"テーマの保存に失敗しました: {str(e)}",
                    className="alert alert-danger",
                ),
                no_update,
            )

    @app.callback(
        Output("theme-preview-store", "data", allow_duplicate=True),
        Output("bootswatch-theme", "href", allow_duplicate=True),
        Output("theme-preview-name", "children", allow_duplicate=True),
        Input({"type": "theme-card", "theme": ALL}, "n_clicks"),
        State("theme-preview-store", "data"),
        prevent_initial_call=True,
    )
    def update_preview_from_card(_, current_selected):
        ctx = callback_context
        if not ctx.triggered:
            raise PreventUpdate
        trig = ctx.triggered_id
        if not isinstance(trig, dict):
            raise PreventUpdate
        selected = trig.get("theme")
        if not selected:
            raise PreventUpdate
        if selected == current_selected:
            raise PreventUpdate
        css = get_bootswatch_css(selected)
        return selected, css, f"選択中: {selected}"

    @app.callback(
        Output({"type": "theme-card", "theme": ALL}, "className"),
        Input("theme-preview-store", "data"),
        State({"type": "theme-card", "theme": ALL}, "id"),
    )
    def mark_active_card(selected, ids):
        base = "card theme-card"
        if not ids:
            raise PreventUpdate
        result = []
        for cid in ids:
            if isinstance(cid, dict) and cid.get("theme") == selected:
                result.append(f"{base} active")
            else:
                result.append(base)
        return result

    # 横スクロール位置の保存・復元（clientside）
    app.clientside_callback(
        ClientsideFunction(namespace="themeScroll", function_name="saveScroll"),
        Output("theme-scroll-pos", "data", allow_duplicate=True),
        Input({"type": "theme-card", "theme": ALL}, "n_clicks"),
        State("theme-card-container", "id"),
        prevent_initial_call=True,
    )

    app.clientside_callback(
        ClientsideFunction(namespace="themeScroll", function_name="restoreScroll"),
        Output("theme-card-container", "style", allow_duplicate=True),
        Input("theme-scroll-pos", "data"),
        State("theme-card-container", "style"),
        prevent_initial_call=True,
    )
