import base64
import datetime
import re
from typing import Any, Dict, List, Optional

import dash
import dash_core_components as dcc
from dash import Input, Output, State, callback_context, html, no_update
from dash.exceptions import PreventUpdate

from components.layout import create_app_layout

# In-memory storage for demo purposes when Supabase is not available
PHOTOS_STORAGE: List[Dict[str, Any]] = []

# Available Bootswatch themes
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

# Load/save theme
THEME_FILE = "theme.txt"


def load_theme() -> str:
    try:
        with open(THEME_FILE, "r") as f:
            theme = f.read().strip()
            if theme in BOOTSWATCH_THEMES:
                return theme
    except FileNotFoundError:
        pass
    return "minty"


def save_theme_to_file(theme: str):
    with open(THEME_FILE, "w") as f:
        f.write(theme)


# Current theme
CURRENT_THEME = load_theme()


def get_bootswatch_css(theme: str) -> str:
    """Get Bootswatch CSS URL for the given theme."""
    return (
        f"https://cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/{theme}/bootstrap.min.css"
    )


from components.pages import (
    render_gallery,
    render_home,
    render_barcode_page,
    render_photo_page,
    render_review_page,
    render_settings,
)
from services.barcode_lookup import (
    lookup_product_by_barcode,
    lookup_product_by_keyword,
)
from services.io_intelligence import describe_image
from services.tag_extraction import extract_tags
from services.barcode_service import decode_from_base64
from services.photo_service import (
    delete_all_products,
    get_all_products,
    get_product_stats,
    insert_product_record,
    insert_photo_record,
    list_storage_buckets,
    upload_to_storage,
)
from services.supabase_client import get_supabase_client

supabase = get_supabase_client()


def _fetch_home_metrics() -> Dict[str, int]:
    try:
        return get_product_stats(supabase)
    except Exception:
        return {"total": 0, "unique": 0}


def _fetch_photos() -> List[Dict[str, Any]]:
    try:
        return get_all_products(supabase)
    except Exception:
        return PHOTOS_STORAGE.copy()  # Fallback to in-memory storage


def _fetch_total_photos() -> int:
    return len(_fetch_photos())


PLACEHOLDER_IMAGE_URL = "https://placehold.co/600x600?text=No+Photo"


def _empty_registration_state() -> Dict[str, Any]:
    return {
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


def _ensure_state(data: Dict[str, Any]) -> Dict[str, Any]:
    state = _empty_registration_state()
    if not isinstance(data, dict):
        return state

    barcode = data.get("barcode") or {}
    state["barcode"].update(
        {
            "value": barcode.get("value"),
            "type": barcode.get("type"),
            "status": barcode.get("status", state["barcode"]["status"]),
            "source": barcode.get("source"),
            "filename": barcode.get("filename"),
        }
    )

    front = data.get("front_photo") or {}
    state["front_photo"].update(
        {
            "content": front.get("content"),
            "filename": front.get("filename"),
            "content_type": front.get("content_type"),
            "status": front.get("status", state["front_photo"]["status"]),
            "description": front.get("description"),
        }
    )

    lookup = data.get("lookup") or {}
    state["lookup"].update(
        {
            "status": lookup.get("status", state["lookup"]["status"]),
            "items": lookup.get("items", []) or [],
            "message": lookup.get("message", ""),
            "source": lookup.get("source"),
            "keyword": lookup.get("keyword"),
        }
    )

    tags = data.get("tags") or {}
    state["tags"].update(
        {
            "status": tags.get("status", state["tags"]["status"]),
            "tags": tags.get("tags", []) or [],
            "message": tags.get("message", state["tags"]["message"]),
        }
    )

    return state


def _serialise_state(state: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "barcode": state["barcode"].copy(),
        "front_photo": state["front_photo"].copy(),
        "lookup": {
            "status": state["lookup"].get("status"),
            "items": [
                item.copy() if isinstance(item, dict) else item
                for item in state["lookup"].get("items", [])
            ],
            "message": state["lookup"].get("message"),
            "source": state["lookup"].get("source"),
            "keyword": state["lookup"].get("keyword"),
        },
        "tags": {
            "status": state["tags"].get("status"),
            "tags": list(state["tags"].get("tags", [])),
            "message": state["tags"].get("message"),
        },
    }


def _render_lookup_card(
    lookup: Dict[str, Any], title: Optional[str] = None
) -> html.Div:
    if not isinstance(lookup, dict):
        return html.Div("商品情報はまだ取得されていません。", className="card-custom")

    items = lookup.get("items") or []
    message = lookup.get("message")
    keyword = lookup.get("keyword")
    status = lookup.get("status")

    children: List[Any] = []
    if title:
        children.append(html.Div(title, className="section-subtitle"))
    if keyword:
        children.append(
            html.Div(f"検索キーワード: {keyword}", className="lookup-keyword")
        )
    if message:
        children.append(html.Div(message, className="lookup-message"))

    if items:
        list_items = []
        for item in items[:3]:
            name = item.get("name") or "商品名不明"
            price = item.get("price")
            price_text = f" / ¥{price:,}" if isinstance(price, (int, float)) else ""
            shop = item.get("shopName") or ""
            url = item.get("affiliateUrl") or item.get("url")
            link = (
                html.A(
                    "商品ページ",
                    href=url,
                    target="_blank",
                    rel="noopener noreferrer",
                    className="product-link",
                )
                if url
                else None
            )
            list_items.append(
                html.Li(
                    [
                        html.Strong(name),
                        html.Span(price_text),
                        html.Br(),
                        html.Span(shop, className="product-shop") if shop else None,
                        html.Br() if link else None,
                        link,
                    ],
                    className="product-summary-item",
                )
            )
        children.append(html.Ul(list_items, className="product-summary"))
    elif status == "success":
        children.append(
            html.Div("商品情報が取得できませんでした。", className="lookup-message")
        )

    if not children:
        children.append(
            html.Div("商品情報はまだ取得されていません。", className="lookup-message")
        )

    return html.Div(children, className="card-custom")


def _render_tags_card(tag_result: Dict[str, Any]) -> html.Div:
    if not isinstance(tag_result, dict):
        return html.Div("タグはまだ生成されていません。", className="card-custom")

    status = tag_result.get("status")
    tags = tag_result.get("tags", [])
    message = tag_result.get("message")

    if status == "loading":
        return html.Div(
            [
                html.Div("タグを生成中です...", className="card-text"),
                html.Div("⏳", className="loading-spinner"),
            ],
            className="card bg-info text-white",
        )

    children: List[Any] = []
    if message:
        children.append(html.Div(message, className="lookup-message"))

    if tags:
        chips = [html.Span(tag, className="tag-chip") for tag in tags]
        children.append(html.Div(chips, className="tag-list"))
    elif status == "success":
        children.append(
            html.Div("タグ候補が見つかりませんでした。", className="lookup-message")
        )

    if not children:
        children.append(
            html.Div("タグはまだ生成されていません。", className="lookup-message")
        )

    return html.Div(children, className="card-custom")


def _update_tags(state: Dict[str, Any]) -> Dict[str, Any]:
    items = state["lookup"].get("items") or []
    description = state["front_photo"].get("description")

    if not items and not description:
        state["tags"] = {
            "status": "not_ready",
            "tags": [],
            "message": "バーコード照合または画像説明の結果が揃うとタグを生成します。",
        }
        return state["tags"]

    tag_result = extract_tags(items, description)
    state["tags"] = tag_result
    return tag_result


# Load theme and create CSS URL
theme_css_url = get_bootswatch_css(CURRENT_THEME)
print(f"Loading theme: {CURRENT_THEME}, CSS URL: {theme_css_url}")

app = dash.Dash(
    __name__,
    suppress_callback_exceptions=True,
    update_title=False,
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


def serve_layout():
    theme = load_theme()
    return create_app_layout(get_bootswatch_css(theme))


app.layout = serve_layout


@app.callback(
    [
        Output("page-content", "children"),
        Output("nav-home", "className"),
        Output("nav-register", "className"),
        Output("nav-gallery", "className"),
        Output("nav-settings", "className"),
    ],
    Input("url", "pathname"),
    prevent_initial_call="initial_duplicate",
)
def display_page(pathname: str):
    classes = [
        "nav-link text-white-50",
        "nav-link text-white-50",
        "nav-link text-white-50",
        "nav-link text-white-50",
    ]

    if pathname == "/register":
        classes[1] = "nav-link active text-white"
        page = render_barcode_page()
    elif pathname == "/register/photo":
        classes[1] = "nav-link active text-white"
        page = render_photo_page()
    elif pathname == "/register/review":
        classes[1] = "nav-link active text-white"
        page = render_review_page()
    elif pathname == "/gallery":
        classes[2] = "nav-link active text-white"
        page = render_gallery(_fetch_photos())
    elif pathname == "/settings":
        classes[3] = "nav-link active text-white"
        page = render_settings(_fetch_total_photos(), load_theme())
    else:
        classes[0] = "nav-link active text-white"
        metrics = _fetch_home_metrics()
        page = render_home(metrics["total"], metrics["unique"])

    return [page, *classes]


@app.callback(
    [
        Output("registration-store", "data", allow_duplicate=True),
        Output("barcode-feedback", "children"),
    ],
    [
        Input("barcode-upload", "contents"),
        Input("barcode-camera-upload", "contents"),
        Input("barcode-manual-submit", "n_clicks"),
        Input("barcode-skip-button", "n_clicks"),
        Input("barcode-retry-button", "n_clicks"),
        Input("barcode-manual-mode", "n_clicks"),
    ],
    [
        State("barcode-upload", "filename"),
        State("barcode-camera-upload", "filename"),
        State("barcode-manual-input", "value"),
        State("registration-store", "data"),
    ],
    prevent_initial_call="initial_duplicate",
)
def handle_barcode_actions(
    upload_contents,
    camera_contents,
    manual_submit,
    skip_click,
    retry_click,
    manual_mode_click,
    upload_filename,
    camera_filename,
    manual_value,
    store_data,
):
    triggered = callback_context.triggered
    if not triggered:
        raise PreventUpdate

    trigger_id = triggered[0]["prop_id"].split(".")[0]
    state = _ensure_state(store_data)
    message = no_update

    def success_message(
        barcode_value: str, barcode_type: str, lookup_result: Dict[str, Any]
    ):
        info_card = html.Div(
            [
                html.Div(
                    "バーコードを取得しました。",
                    className="card-custom",
                    style={
                        "marginBottom": "10px",
                        "fontWeight": "600",
                        "color": "#4caf50",
                    },
                ),
                html.Div(
                    [
                        html.Div(
                            f"番号: {barcode_value}", style={"marginBottom": "4px"}
                        ),
                        html.Div(f"種別: {barcode_type}"),
                    ],
                    className="card-custom",
                ),
            ]
        )
        lookup_card = _render_lookup_card(lookup_result, title="楽天API照合結果")
        return html.Div([info_card, lookup_card])

    if trigger_id == "barcode-skip-button":
        state["barcode"].update(
            {
                "value": None,
                "type": None,
                "status": "skipped",
                "source": "skip",
                "filename": None,
            }
        )
        state["lookup"] = {
            "status": "skipped",
            "items": [],
            "message": "バーコード登録をスキップしました。必要に応じて後から登録できます。",
            "source": "skip",
            "keyword": None,
        }
        message = html.Div(state["lookup"]["message"], className="card-custom")
    elif trigger_id == "barcode-retry-button":
        state["barcode"] = _empty_registration_state()["barcode"].copy()
        state["lookup"] = _empty_registration_state()["lookup"].copy()
        message = html.Div(
            "バーコード読み取りを再度お試しください。",
            className="card-custom",
        )
    elif trigger_id == "barcode-manual-mode":
        state["barcode"].update(
            {"status": "manual_pending", "source": "manual", "filename": None}
        )
        message = html.Div(
            "バーコード番号を入力し「番号を登録」を押してください。",
            className="card-custom",
        )
    elif trigger_id == "barcode-manual-submit":
        if not manual_value:
            message = html.Div(
                "バーコード番号を入力してください。",
                className="alert alert-danger",
            )
        else:
            barcode_value = manual_value.strip()
            print(f"DEBUG: Manual barcode input: {barcode_value}")
            lookup_result = lookup_product_by_barcode(barcode_value)
            print(f"DEBUG: Rakuten API result for manual: {lookup_result}")
            state["barcode"].update(
                {
                    "value": barcode_value,
                    "type": "MANUAL",
                    "status": "manual",
                    "source": "manual",
                    "filename": None,
                }
            )
            state["lookup"] = lookup_result
            print(f"DEBUG: Saved lookup to state: {state.get('lookup')}")
            message = success_message(barcode_value, "MANUAL", lookup_result)
    elif trigger_id in {"barcode-upload", "barcode-camera-upload"}:
        contents = (
            camera_contents
            if trigger_id == "barcode-camera-upload"
            else upload_contents
        )
        filename = (
            camera_filename
            if trigger_id == "barcode-camera-upload"
            else upload_filename
        )
        if not contents:
            raise PreventUpdate
        try:
            decode_result = decode_from_base64(contents)
        except ValueError as exc:
            state["lookup"] = {
                "status": "error",
                "items": [],
                "message": str(exc),
                "source": "barcode",
                "keyword": None,
            }
            message = html.Div(
                str(exc),
                className="alert alert-danger",
            )
        else:
            if not decode_result:
                state["lookup"] = {
                    "status": "not_found",
                    "items": [],
                    "message": "バーコードが検出できませんでした。",
                    "source": "barcode",
                    "keyword": None,
                }
                message = html.Div(
                    [
                        html.Div(
                            "バーコードが検出できませんでした。",
                            style={
                                "color": "#ff6b6b",
                                "fontWeight": "600",
                                "marginBottom": "6px",
                            },
                        ),
                        html.Div(
                            "「もう一度挑戦する」または「バーコードをスキップ」を選択してください。"
                        ),
                    ],
                    className="card-custom",
                )
            else:
                barcode_value = decode_result["barcode"]
                barcode_type = decode_result["barcode_type"]
                print(f"DEBUG: Decoded barcode: {barcode_value}, type: {barcode_type}")
                lookup_result = lookup_product_by_barcode(barcode_value)
                print(f"DEBUG: Rakuten API result for decoded: {lookup_result}")
                state["barcode"].update(
                    {
                        "value": barcode_value,
                        "type": barcode_type,
                        "status": "captured",
                        "source": "camera"
                        if trigger_id == "barcode-camera-upload"
                        else "upload",
                        "filename": filename,
                    }
                )
                state["lookup"] = lookup_result
                print(f"DEBUG: Saved lookup to state: {state.get('lookup')}")
                message = success_message(barcode_value, barcode_type, lookup_result)

    _update_tags(state)

    if trigger_id == "barcode-skip-button":
        url = "/register/photo"
    elif state["lookup"]["status"] == "success":
        url = "/register/photo"
    else:
        url = no_update
        if state["barcode"]["status"] in ["captured", "error"]:
            message = html.Div(
                [
                    message,
                    html.Button("もう一度挑戦する", id="barcode-retry-button"),
                    html.Button("スキップ", id="barcode-skip-button"),
                ]
            )

    return _serialise_state(state), message


@app.callback(
    Output("registration-store", "data", allow_duplicate=True),
    Input("registration-store", "data"),
    prevent_initial_call="initial_duplicate",
)
def process_tags(store_data):
    state = _ensure_state(store_data)
    if state["tags"]["status"] == "loading":
        _update_tags(state)
        return _serialise_state(state)
    raise PreventUpdate


@app.callback(Output("tag-feedback", "children"), Input("registration-store", "data"))
def render_tag_feedback(store_data):
    state = _ensure_state(store_data)
    return _render_tags_card(state["tags"])


@app.callback(
    [
        Output("registration-store", "data", allow_duplicate=True),
        Output("front-feedback", "children"),
    ],
    [
        Input("front-upload", "contents"),
        Input("front-camera-upload", "contents"),
        Input("front-skip-button", "n_clicks"),
    ],
    [
        State("front-upload", "filename"),
        State("front-camera-upload", "filename"),
        State("registration-store", "data"),
    ],
    prevent_initial_call="initial_duplicate",
)
def handle_front_photo(
    upload_contents,
    camera_contents,
    skip_click,
    upload_filename,
    camera_filename,
    store_data,
):
    triggered = callback_context.triggered
    if not triggered:
        raise PreventUpdate

    trigger_id = triggered[0]["prop_id"].split(".")[0]
    state = _ensure_state(store_data)
    message = no_update

    if trigger_id == "front-skip-button":
        state["front_photo"].update(
            {
                "content": None,
                "filename": None,
                "content_type": None,
                "status": "skipped",
                "description": None,
            }
        )
        message = html.Div(
            "正面写真は後からでも登録できます。",
            className="card-custom",
        )
        print(f"DEBUG handle_front_photo: photo skipped")
        return _serialise_state(state), message
    else:
        contents = (
            camera_contents if trigger_id == "front-camera-upload" else upload_contents
        )
        filename = (
            camera_filename if trigger_id == "front-camera-upload" else upload_filename
        )
        if not contents:
            raise PreventUpdate

        header = contents.split(",", 1)[0]
        content_type = header.replace("data:", "").split(";")[0]
        state["front_photo"].update(
            {
                "content": contents,
                "filename": filename or "front_photo.jpg",
                "content_type": content_type or "image/jpeg",
                "status": "captured",
            }
        )
        print(
            f"DEBUG handle_front_photo: photo captured, new status={state['front_photo']['status']}"
        )

        # IO Intelligenceで画像説明を生成
        try:
            description_result = describe_image(contents)
            if description_result["status"] == "success":
                state["front_photo"]["description"] = description_result["text"]

                # タグ生成プロセスを開始
                if state["lookup"].get("items") or state["front_photo"]["description"]:
                    state["tags"]["status"] = "loading"

            else:
                state["front_photo"]["description"] = None
        except Exception as io_error:
            state["front_photo"]["description"] = None

        preview_card = html.Div(
            [
                html.Div(
                    "正面写真を取得しました。",
                    style={
                        "color": "#4caf50",
                        "fontWeight": "600",
                        "marginBottom": "8px",
                    },
                ),
                html.Img(
                    src=contents,
                    style={
                        "width": "100%",
                        "maxHeight": "300px",
                        "objectFit": "contain",
                        "borderRadius": "15px",
                    },
                ),
            ],
            className="card-custom",
        )

        # IOインテリジェンスの処理をバックグラウンドで開始
        # ここでは状態のみ更新し、実際の処理は後で行う
        state["description"] = {"status": "processing"}
        state["tags"]["status"] = "processing"

        cards = [preview_card]
        message = html.Div(cards)
        print(
            f"DEBUG handle_front_photo: photo processing started, status={state['front_photo']['status']}"
        )

    print(f"DEBUG handle_front_photo: photo uploaded successfully")
    return _serialise_state(state), message


# 写真アップロード後のページ遷移 - 一時的に無効化
# @app.callback(
#     Output("url", "pathname", allow_duplicate=True),
#     Input("registration-store", "data"),
#     prevent_initial_call=True,
# )
# def auto_navigate_on_photo_upload(store_data):
#     """写真がアップロードされたら自動的にレビュー画面に遷移"""
#     # コメントアウトされています


# 写真アップロード後のページ遷移
@app.callback(
    Output("url", "pathname", allow_duplicate=True),
    Input("registration-store", "data"),
    prevent_initial_call=True,
)
def auto_navigate_on_photo_upload(store_data):
    """写真がアップロードされたら自動的にレビュー画面に遷移"""
    if not store_data:
        raise PreventUpdate

    state = _ensure_state(store_data)
    barcode_ready = state["barcode"]["status"] in {"captured", "manual", "skipped"}
    photo_ready = state["front_photo"]["status"] in {"captured", "skipped"}

    print(
        f"DEBUG auto_navigate_on_photo_upload: barcode_ready={barcode_ready}, photo_ready={photo_ready}"
    )
    print(
        f"DEBUG auto_navigate_on_photo_upload: barcode_status={state['barcode']['status']}, photo_status={state['front_photo']['status']}"
    )

    # バーコードのみ完了の場合は写真ページに遷移
    if barcode_ready and not photo_ready:
        print(f"DEBUG auto_navigate_on_photo_upload: navigating to /register/photo")
        return "/register/photo"
    # バーコードと写真が両方完了の場合はレビュー画面に遷移
    elif barcode_ready and photo_ready:
        print(f"DEBUG auto_navigate_on_photo_upload: navigating to /register/review")
        return "/register/review"

    print(f"DEBUG auto_navigate_on_photo_upload: not navigating")
    raise PreventUpdate


# 保存ボタンの有効/無効状態制御
@app.callback(Output("save-button", "disabled"), Input("registration-store", "data"))
def toggle_save_button(data):
    state = _ensure_state(data)
    barcode_ready = state["barcode"]["status"] in {"captured", "manual", "skipped"}
    photo_ready = state["front_photo"]["status"] in {"captured", "skipped"}

    # バーコードまたは写真のどちらかが準備できていれば保存可能
    disabled = not (barcode_ready or photo_ready)

    return disabled


@app.callback(
    [
        Output("tag-checklist", "options", allow_duplicate=True),
        Output("tag-checklist", "value", allow_duplicate=True),
    ],
    Input("registration-store", "data"),
    State("tag-checklist", "value"),
    prevent_initial_call="initial_duplicate",
)
def sync_tag_checklist(store_data, current_value):
    state = _ensure_state(store_data)
    tags = state["tags"].get("tags") or []
    current_value = current_value or []
    all_tags = list(dict.fromkeys(tags + current_value))
    options = [{"label": tag, "value": tag} for tag in all_tags]

    if not tags and not current_value:
        return options, []

    if current_value:
        filtered = [tag for tag in current_value if tag in all_tags]
        return options, filtered

    return options, tags


@app.callback(
    [
        Output("tag-checklist", "value", allow_duplicate=True),
        Output("tag-checklist", "options", allow_duplicate=True),
        Output("custom-tag-input", "value", allow_duplicate=True),
    ],
    Input("add-tag-button", "n_clicks"),
    State("custom-tag-input", "value"),
    State("tag-checklist", "value"),
    State("tag-checklist", "options"),
    prevent_initial_call="initial_duplicate",
)
def add_custom_tag(n_clicks, tag_value, current_value, options):
    if not n_clicks or not tag_value:
        raise PreventUpdate

    tag = tag_value.strip()
    if not tag:
        raise PreventUpdate

    current_value = current_value or []
    options = options or []

    if tag not in [opt["value"] for opt in options if isinstance(opt, dict)]:
        options = options + [{"label": tag, "value": tag}]

    if tag not in current_value:
        current_value = current_value + [tag]

    return current_value, options, ""


@app.callback(
    Output("review-summary", "children"),
    [
        Input("product-name-input", "value"),
        Input("product-shape-input", "value"),
        Input("works-series-name-input", "value"),
        Input("works-name-input", "value"),
        Input("character-name-input", "value"),
        Input("purchase-price-input", "value"),
        Input("note-editor", "value"),
        Input("other-tags-checklist", "value"),
        Input("registration-store", "data"),
    ],
)
def render_review_summary(
    product_name,
    product_shape,
    works_series_name,
    works_name,
    character_name,
    purchase_price,
    note_text,
    other_tags,
    store_data,
):
    state = _ensure_state(store_data)
    other_tags = other_tags or []
    note_text = (note_text or "").strip()

    barcode_value = state["barcode"].get("value") or "未取得"
    barcode_type = state["barcode"].get("type") or "不明"

    # フォームからの情報を使用
    display_product_name = product_name or "未入力"
    display_product_shape = product_shape or "未入力"
    display_works_series = works_series_name or "未入力"
    display_works = works_name or "未入力"
    display_character = character_name or "未入力"
    display_price = f"{purchase_price}円" if purchase_price else "未入力"

    return html.Div(
        [
            html.Div(
                [
                    html.Div("登録内容のまとめ", className="section-subtitle"),
                    html.Ul(
                        [
                            html.Li(f"バーコード: {barcode_value} ({barcode_type})"),
                            html.Li(f"製品名: {display_product_name}"),
                            html.Li(f"製品の形: {display_product_shape}"),
                            html.Li(f"作品シリーズ: {display_works_series}"),
                            html.Li(f"作品名: {display_works}"),
                            html.Li(f"キャラクター: {display_character}"),
                            html.Li(f"購入価格: {display_price}"),
                            html.Li(
                                f"その他タグ: {', '.join(other_tags)}"
                                if other_tags
                                else "その他タグ: 未選択"
                            ),
                            html.Li(
                                f"メモ: {note_text}" if note_text else "メモ: (未入力)"
                            ),
                        ],
                    ),
                ],
                className="review-summary-card",
            ),
            html.Div(
                [
                    html.Div("画像説明", className="section-subtitle"),
                    html.P(
                        description or "画像説明は生成されていません。",
                        className="description-text",
                    ),
                ],
                className="review-summary-card",
            ),
        ]
    )


@app.callback(
    Output("photo-thumbnail", "src"),
    Input("registration-store", "data"),
)
def update_photo_thumbnail(store_data):
    """レビュー画面で写真サムネールを表示"""
    print("DEBUG: update_photo_thumbnail called")

    if not store_data:
        print("DEBUG: No store data")
        return ""

    state = _ensure_state(store_data)
    front_photo = state.get("front_photo", {})

    if front_photo.get("content"):
        # Base64エンコードされた画像データを直接使用
        content = front_photo["content"]
        print(f"DEBUG: Photo content found, length: {len(content)}")
        if content.startswith("data:image"):
            print("DEBUG: Content is data URL format")
        else:
            print("DEBUG: Content is NOT data URL format")
        print(f"DEBUG: Content preview: {content[:50]}...")
        return content
    else:
        print("DEBUG: No photo content")
        return ""


# STEP4自動反映用のインターバル（レイアウト関数内で定義）


@app.callback(
    Output("auto-fill-trigger", "children"),
    Input("url", "pathname"),
    prevent_initial_call=True,
)
def trigger_auto_fill_on_page_change(pathname):
    """ページ遷移時に自動反映をトリガー"""
    if pathname == "/register":
        print("DEBUG: Triggering auto-fill for STEP4")
        return "trigger"  # トリガー
    return ""


@app.callback(
    [
        Output("product-group-name-input", "value"),
        Output("works-series-name-input", "value"),
        Output("works-name-input", "value"),
        Output("character-name-input", "value"),
        Output("copyright-company-input", "value"),
        Output("note-editor", "value"),
        Output("other-tags-checklist", "value"),
    ],
    Input("auto-fill-trigger", "children"),
    State("registration-store", "data"),
    State("url", "pathname"),
    prevent_initial_call=True,
)
def auto_fill_form_from_tags(trigger, store_data, pathname):
    """STEP4でページ遷移後にタグから自動でフォームを埋める"""
    print(
        f"DEBUG: auto_fill_form_from_tags called (trigger: {trigger}, pathname: {pathname})"
    )

    # STEP4のページのみ処理
    if pathname != "/register" or not trigger:
        print("DEBUG: Not on register page or no trigger, skipping")
        return [""] * 7

    if not store_data:
        print("DEBUG: No store data")
        return [""] * 7

    state = _ensure_state(store_data)

    # 写真データがあるか確認
    front_photo = state.get("front_photo", {})
    if not front_photo.get("content"):
        print("DEBUG: No photo content, skipping auto-fill")
        return [""] * 7

    # IO Intelligenceタグがあるか確認
    tags_data = state.get("tags", {})
    if not tags_data.get("tags") or not isinstance(tags_data["tags"], list):
        print("DEBUG: No IO Intelligence tags")
        return [""] * 7

    # すでに自動反映済みかチェック
    if state.get("auto_filled", False):
        print("DEBUG: Already auto-filled")
        return [""] * 7

    tags = tags_data["tags"][:10]  # 最大10個のタグを使用
    print(f"DEBUG: Processing {len(tags)} tags: {tags}")

    # デフォルト値
    product_group_name = ""
    works_series_name = ""
    works_name = ""
    character_name = ""
    copyright_company_name = ""
    memo = ""
    other_tags = []

    # タグを分類して各フィールドに割り当て
    product_related = []  # 製品関連
    character_related = []  # キャラクター関連
    work_related = []  # 作品関連
    other_features = []  # その他の特徴

    # タグを分類
    for tag in tags:
        tag_lower = tag.lower()
        if any(
            keyword in tag_lower
            for keyword in [
                "badge",
                "keychain",
                "sticker",
                "poster",
                "card",
                "figure",
                "goods",
                "merchandise",
                "pin",
                "button",
                "acrylic",
            ]
        ):
            product_related.append(tag)
        elif any(
            keyword in tag_lower
            for keyword in [
                "character",
                "girl",
                "boy",
                "person",
                "anime",
                "manga",
                "chibi",
                "cute",
            ]
        ):
            character_related.append(tag)
        elif any(
            keyword in tag_lower
            for keyword in ["bangdream", "lovelive", "idol", "music", "band", "series"]
        ):
            work_related.append(tag)
        else:
            other_features.append(tag)

    # 各フィールドに割り当て
    if product_related:
        product_group_name = product_related[0]  # 最初の製品関連タグ

    if work_related:
        # 作品シリーズと作品名を分離
        if len(work_related) >= 2:
            works_series_name = work_related[0]
            works_name = work_related[1]
        elif len(work_related) == 1:
            works_series_name = work_related[0]

    if character_related:
        character_name = " ".join(
            character_related[:2]
        )  # 最大2つのキャラクター関連タグ

    # 残りのタグをその他タグとメモに分配
    remaining_tags = other_features[:5]  # 最大5個をその他タグに
    memo_tags = other_features[5:8]  # 残りをメモに

    if remaining_tags:
        other_tags = [{"label": tag, "value": tag} for tag in remaining_tags]

    if memo_tags:
        memo = f"特徴: {', '.join(memo_tags)}"

    print(
        f"DEBUG: Auto-filled - product_group: '{product_group_name}', works_series: '{works_series_name}', works: '{works_name}', character: '{character_name}', memo: '{memo}', other_tags: {[t.get('value') for t in other_tags]}"
    )

    # 自動反映済みフラグを設定（次の呼び出しでスキップするため）
    state["auto_filled"] = True

    return (
        product_group_name,
        works_series_name,
        works_name,
        character_name,
        copyright_company_name,
        memo,
        other_tags,
    )


@app.callback(
    [
        Output("rakuten-lookup-display", "children"),
        Output("io-intelligence-tags-display", "children"),
    ],
    Input("registration-store", "data"),
)
def display_api_results(store_data):
    """レビュー画面で楽天APIとIO Intelligenceの結果を表示"""
    print(f"DEBUG: display_api_results called")
    print(
        f"DEBUG: store_data keys: {list(store_data.keys()) if store_data else 'None'}"
    )

    state = _ensure_state(store_data)

    # 楽天API結果の表示
    lookup_result = state.get("lookup")
    rakuten_display = html.Div(
        "バーコード情報がありません", className="alert alert-info"
    )
    if lookup_result:
        try:
            rakuten_display = _render_lookup_card(
                lookup_result, title="楽天API照合結果"
            )
            print("DEBUG: Rakuten lookup card rendered successfully")
        except Exception as e:
            print(f"DEBUG: Error rendering rakuten lookup card: {e}")
            rakuten_display = html.Div(
                f"楽天API表示エラー: {str(e)}", className="alert alert-danger"
            )

    # IO Intelligenceタグの表示
    tags_data = state.get("tags", {})
    tags_display = html.Div("画像分析情報がありません", className="alert alert-info")
    if tags_data.get("tags"):
        try:
            tags_list = tags_data["tags"]
            if isinstance(tags_list, list) and tags_list:
                tags_display = html.Div(
                    [
                        html.H5("IO Intelligence タグ抽出結果", className="mb-3"),
                        html.Div(
                            [
                                html.Span(tag, className="badge bg-secondary me-1 mb-1")
                                for tag in tags_list[:20]  # 最大20個表示
                            ]
                        ),
                    ]
                )
                print(f"DEBUG: IO Intelligence tags rendered: {len(tags_list)} tags")
            else:
                tags_display = html.Div(
                    "タグ情報が見つかりません", className="alert alert-warning"
                )
        except Exception as e:
            print(f"DEBUG: Error rendering IO Intelligence tags: {e}")
            tags_display = html.Div(
                f"タグ表示エラー: {str(e)}", className="alert alert-danger"
            )
    else:
        print("DEBUG: No IO Intelligence tags found")

    return rakuten_display, tags_display


@app.callback(
    Output("register-alert", "children"),
    [
        Input("save-button", "n_clicks"),
        State("registration-store", "data"),
        State("product-name-input", "value"),
        State("product-group-name-input", "value"),
        State("works-series-name-input", "value"),
        State("works-name-input", "value"),
        State("character-name-input", "value"),
        State("copyright-company-input", "value"),
        State("purchase-price-input", "value"),
        State("purchase-location-input", "value"),
        State("purchase-date-input", "date"),
        State("note-editor", "value"),
    ],
    prevent_initial_call=True,  # 本番用に戻す
)
def save_registration(
    n_clicks,
    store_data,
    product_name,
    product_group_name,
    works_series_name,
    works_name,
    character_name,
    copyright_company_name,
    purchase_price,
    purchase_location,
    purchase_date,
    memo,
):
    """製品情報を保存"""
    print("=== SAVE_REGISTRATION STARTED ===")
    print(f"n_clicks: {n_clicks}")
    print(f"product_name: '{product_name}'")

    # デバッグ情報を専用ファイルに書き込み
    debug_info = f"""=== SAVE REGISTRATION DEBUG ===
Called at: {__import__("datetime").datetime.now()}
n_clicks: {n_clicks}
product_name: '{product_name}'
store_data keys: {list(store_data.keys()) if store_data else "None"}
"""

    # 専用ログファイルに書き込み（最も確実）
    try:
        with open("save_registration_debug.txt", "a", encoding="utf-8") as f:
            f.write(debug_info + "\n")
            f.flush()
    except Exception as e:
        pass  # ファイル書き込み失敗でも処理続行

    # コンソール出力（一応）
    print(f"SAVE_CALLBACK: n_clicks={n_clicks}, product='{product_name}'")

    if not n_clicks:
        try:
            with open("debug_log.txt", "a", encoding="utf-8") as f:
                f.write(f"DEBUG: n_clicks is falsy, raising PreventUpdate\n")
        except Exception as debug_error:
            print(f"DEBUG WRITE ERROR: {debug_error}")
        raise PreventUpdate

    # 必須項目チェック（製品名のみ必須）
    if not product_name or product_name.strip() == "":
        return html.Div(
            "製品名は必須項目です。入力してください。", className="alert alert-danger"
        )

    try:
        # registration-storeからデータを取得
        state = _ensure_state(store_data)
        print(f"State retrieved, keys: {list(state.keys())}")

        # 写真の保存
        photo_id = None
        print(f"front_photo data: {state.get('front_photo', 'NO_DATA')}")
        print(
            f"front_photo content exists: {bool(state.get('front_photo', {}).get('content'))}"
        )

        with open("debug_log.txt", "a", encoding="utf-8") as f:
            f.write(f"DEBUG: front_photo data: {state.get('front_photo', 'NO_DATA')}\n")
            f.write(
                f"DEBUG: front_photo content exists: {bool(state.get('front_photo', {}).get('content'))}\n"
            )

        # 写真データの保存（写真なしでもOK）
        photo_id = None
        if state.get("front_photo", {}).get("content"):
            print("Starting photo processing...")
            try:
                # Supabase Storageを使用
                content_string = state["front_photo"]["content"].split(",", 1)[1]
                file_bytes = base64.b64decode(content_string)

                # photoレコードを作成
                print("Inserting photo record...")
                photo_id = insert_photo_record(
                    supabase,
                    image_url="",  # Will be updated after upload
                    thumbnail_url="",  # Will be updated after upload
                    front_flag=1,
                )
                print(f"Photo record inserted, photo_id: {photo_id}")

                # 画像をSupabase Storageにアップロード
                if photo_id:
                    print("Photo ID exists, uploading to storage...")
                    image_url = upload_to_storage(
                        supabase,
                        file_bytes,
                        f"photo_{photo_id}.jpg",
                        state["front_photo"].get("content_type", "image/jpeg"),
                    )
                    print(f"Upload result: {image_url}")

                    if image_url:
                        print("Updating photo record with URL...")
                        # 画像URLを更新
                        supabase.table("photo").update(
                            {"image_url": image_url, "thumbnail_url": image_url}
                        ).eq("photo_id", photo_id).execute()
                        print("Photo record updated with URL")

            except Exception as photo_error:
                print(f"Photo processing failed: {photo_error}")
                # 写真保存失敗でも製品登録は続行（photo_id = None）
        else:
            print("No photo content found, skipping photo processing")

        print(f"Final photo_id: {photo_id}")

        # 製品情報の保存 - Supabaseを使用（ローカルDB分岐削除）
        insert_product_record(
            supabase,
            photo_id=photo_id,  # photo_idはNULLでも可
            barcode=state["barcode"].get("value") or "",
            barcode_type=state["barcode"].get("type") or "UNKNOWN",
            product_name=product_name,
            product_group_name=product_group_name or "",
            works_series_name=works_series_name or "",
            title=works_name or "",
            character_name=character_name or "",
            purchase_price=int(purchase_price) if purchase_price else None,
            purchase_location=purchase_location or "",
            memo=memo or "",
        )

        with open("debug_log.txt", "a", encoding="utf-8") as f:
            f.write(
                f"DEBUG: Successfully saved product - Name: {product_name}, Photo ID: {photo_id}\n"
            )
            f.write(f"DEBUG: Returning success message\n")
        return html.Div("製品情報を保存しました！", className="alert alert-success")

    except Exception as e:
        with open("debug_log.txt", "a", encoding="utf-8") as f:
            f.write(f"ERROR: Failed to save product: {e}\n")
        return html.Div(
            f"保存中にエラーが発生しました: {str(e)}", className="alert alert-danger"
        )


# Theme management callbacks
@app.callback(
    Output("theme-save-result", "children"),
    Input("save-theme-button", "n_clicks"),
    State("theme-selector", "value"),
    prevent_initial_call=True,
)
def save_theme(n_clicks, selected_theme):
    """Save selected theme to file."""
    if not n_clicks:
        raise PreventUpdate

    try:
        save_theme_to_file(selected_theme)
        return html.Div(
            f"テーマ '{selected_theme}' を保存しました。ページをリロードしてください。",
            className="alert alert-success",
        )
    except Exception as e:
        return html.Div(f"テーマ保存エラー: {str(e)}", className="alert alert-danger")


@app.callback(
    Output("bootswatch-theme", "href"),
    Input("theme-selector", "value"),
    prevent_initial_call=True,
)
def update_theme_css(selected_theme):
    """Update the CSS href when theme selector changes."""
    return get_bootswatch_css(selected_theme)


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8050))
    app.run_server(host="0.0.0.0", port=port)
