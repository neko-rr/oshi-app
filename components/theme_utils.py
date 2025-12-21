# Available Bootswatch themes
from typing import Optional

from services.theme_service import (
    DEFAULT_THEME,
    get_theme,
    set_theme,
    GUEST_MEMBERS_ID,
    GUEST_MEMBERS_TYPE_NAME,
)

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


def load_theme(
    members_id: Optional[int] = None, members_type_name: Optional[str] = None
) -> str:
    """Supabase 優先でテーマ取得。未設定/失敗時はローカル→デフォルト minty。"""
    mid = members_id if members_id is not None else GUEST_MEMBERS_ID
    mtype = (
        members_type_name if members_type_name is not None else GUEST_MEMBERS_TYPE_NAME
    )
    theme = get_theme(mid, mtype)
    if theme:
        return theme
    return _load_theme_from_file()


def save_theme(
    theme: str,
    members_id: Optional[int] = None,
    members_type_name: Optional[str] = None,
) -> None:
    """Supabase に保存し、失敗時はローカルファイルにフォールバック。"""
    mid = members_id if members_id is not None else GUEST_MEMBERS_ID
    mtype = (
        members_type_name if members_type_name is not None else GUEST_MEMBERS_TYPE_NAME
    )
    saved = set_theme(theme, mid, mtype)
    if not saved:
        _save_theme_to_file(theme)


# Current theme
CURRENT_THEME = load_theme()


def get_bootswatch_css(theme: str) -> str:
    """Get Bootswatch CSS URL for the given theme."""
    return (
        f"https://cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/{theme}/bootstrap.min.css"
    )


# Theme management callbacks
def register_theme_callbacks(app):
    from dash import Input, Output, State, html

    @app.callback(
        Output("theme-save-result", "children", allow_duplicate=True),
        Input("save-theme-button", "n_clicks"),
        State("theme-selector", "value"),
        prevent_initial_call="initial_duplicate",
    )
    def save_theme_callback(n_clicks, selected_theme):
        if not n_clicks or not selected_theme:
            return ""

        try:
            save_theme(selected_theme)
            return html.Div(
                f"テーマ '{selected_theme}' を保存しました。",
                className="alert alert-success",
            )
        except Exception as e:
            return html.Div(
                f"テーマの保存に失敗しました: {str(e)}",
                className="alert alert-danger",
            )

    @app.callback(
        Output("bootswatch-theme", "href"),
        Input("theme-selector", "value"),
        prevent_initial_call=True,
    )
    def update_theme_css(selected_theme):
        return get_bootswatch_css(selected_theme)
