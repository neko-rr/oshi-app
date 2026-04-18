# Available Bootswatch themes
from typing import Optional

from components.theme_palette import BOOTSWATCH_SWATCH
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

# 設定画面のカード生成順（BOOTSWATCH_SWATCH.keys）と Dash ALL の出力適用順を揃える
_THEME_CARD_LAYOUT_ORDER = {
    name: idx for idx, name in enumerate(BOOTSWATCH_SWATCH.keys())
}


def _sorted_theme_card_ids(ids):
    """ALL の id 列挙順がレイアウトとずれても、className リストをカード並びに一致させる。"""
    if not ids:
        return []

    def sort_key(cid):
        if isinstance(cid, dict) and cid.get("type") == "theme-card":
            t = cid.get("theme")
            if isinstance(t, str):
                return _THEME_CARD_LAYOUT_ORDER.get(t, 10_000)
        return 10_000

    return sorted(ids, key=sort_key)


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
    """Supabase 優先でテーマ取得。未ログイン時のみ theme.txt にフォールバック。"""
    mid = _infer_members_id(members_id)
    mtype = members_type_name or DEFAULT_MEMBERS_TYPE_NAME
    if mid:
        raw = get_theme(mid, mtype)
        if raw:
            t = str(raw).strip()
            if t in BOOTSWATCH_THEMES:
                return t
        # ログイン済みなのに DB から有効名が取れない場合、theme.txt に落とすと未ログイン時の値と混線する
        return DEFAULT_THEME
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
        dcc,
        no_update,
    )
    from dash.exceptions import PreventUpdate

    @app.callback(
        Output("theme-save-result", "children", allow_duplicate=True),
        Output("bootswatch-theme", "href", allow_duplicate=True),
        Output("theme-store", "data", allow_duplicate=True),
        Input("save-theme-button", "n_clicks"),
        State("theme-preview-store", "data"),
        prevent_initial_call="initial_duplicate",
    )
    def save_theme_callback(n_clicks, selected_theme):
        if not n_clicks or not selected_theme:
            return "", no_update, no_update

        try:
            save_theme(selected_theme)
            return (
                html.Div(
                    f"テーマ '{selected_theme}' を保存しました。",
                    className="alert alert-success",
                ),
                get_bootswatch_css(selected_theme),
                {"theme": selected_theme},
            )
        except Exception as e:
            return (
                html.Div(
                    f"テーマの保存に失敗しました: {str(e)}",
                    className="alert alert-danger",
                ),
                no_update,
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

    # 設定ページ表示時は theme-store を信用しない（未ログイン時や古い値が残り DB とずれるため）。
    # bootswatch-theme.href は app._sync_nav 等と pathname を共有すると Dash 4 で重複登録になるため、
    # ここでは Store/ラベル/カードのみ更新し、href は themeScroll.applyBootswatchFromStores（clientside）に任せる。
    @app.callback(
        Output("theme-preview-store", "data", allow_duplicate=True),
        Output("theme-preview-name", "children", allow_duplicate=True),
        Output({"type": "theme-card", "theme": ALL}, "className", allow_duplicate=True),
        Input("_pages_location", "pathname"),
        State({"type": "theme-card", "theme": ALL}, "id"),
        prevent_initial_call=False,
    )
    def sync_settings_theme_preview_from_pathname(pathname, ids):
        if pathname != "/settings":
            raise PreventUpdate
        theme = load_theme()
        if theme not in BOOTSWATCH_THEMES:
            theme = DEFAULT_THEME
        label = f"選択中: {theme}"
        base = "card theme-card"
        if not ids:
            return theme, label, no_update
        class_names = []
        for cid in _sorted_theme_card_ids(ids):
            if isinstance(cid, dict) and cid.get("theme") == theme:
                class_names.append(f"{base} active")
            else:
                class_names.append(base)
        return theme, label, class_names

    @app.callback(
        Output({"type": "theme-card", "theme": ALL}, "className", allow_duplicate=True),
        Input("theme-preview-store", "data"),
        State({"type": "theme-card", "theme": ALL}, "id"),
    )
    def mark_active_card(selected, ids):
        base = "card theme-card"
        if not ids:
            raise PreventUpdate
        if isinstance(selected, dict):
            selected = selected.get("theme")
        result = []
        for cid in _sorted_theme_card_ids(ids):
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

    # --- Client-side: theme-store / 設定プレビュー / pathname から bootswatch link を反映（サーバーと pathname 重複を避ける） ---
    app.clientside_callback(
        ClientsideFunction(
            namespace="themeScroll",
            function_name="applyBootswatchFromStores",
        ),
        Output("bootswatch-theme", "href", allow_duplicate=True),
        [
            Input("theme-store", "data"),
            Input("theme-preview-store", "data"),
            Input("_pages_location", "pathname"),
        ],
        prevent_initial_call=True,
    )

    app.clientside_callback(
        ClientsideFunction(namespace="themeScroll", function_name="restoreScroll"),
        Output("theme-card-container", "style", allow_duplicate=True),
        Input("theme-scroll-pos", "data"),
        State("theme-card-container", "style"),
        prevent_initial_call=True,
    )
