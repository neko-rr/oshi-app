import base64
import datetime
import re
from typing import Any, Dict, List, Optional

import dash
from dash import Input, Output, State, callback_context, html, dcc, no_update
from dash.exceptions import PreventUpdate

from components.layout import create_app_layout

# Load environment variables EARLY so services read correct .env (models, flags)
try:
    from dotenv import load_dotenv

    load_dotenv()
    print("DEBUG: Early .env loaded before services imports")
except Exception as _early_env_err:
    print(f"DEBUG: Early .env load skipped: {_early_env_err}")

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
            "model_used": None,
            "description_status": "idle",
            "vision_source": None,
            "vision_raw": None,
            "structured_data": None,
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
            "model_used": front.get("model_used"),
            "description_status": front.get(
                "description_status", state["front_photo"]["description_status"]
            ),
            "vision_source": front.get("vision_source"),
            "vision_raw": front.get("vision_raw"),
            "structured_data": front.get("structured_data"),
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

    children: List[Any] = []
    if status == "loading":
        children.append(
            html.Div(
                [
                    html.Div(
                        message or "タグを生成中です...",
                        className="card-text fw-semibold mb-2",
                    ),
                    html.Div("⏳", className="loading-spinner"),
                ],
                className="tag-loading d-flex align-items-center gap-2",
            )
        )
    elif message:
        children.append(html.Div(message, className="lookup-message"))

    if tags:
        chips = [html.Span(tag, className="tag-chip") for tag in tags]
        children.append(html.Div(chips, className="tag-list"))
    elif status == "success":
        children.append(
            html.Div("タグ候補が見つかりませんでした。", className="lookup-message")
        )
    elif status == "loading":
        children.append(
            html.Div("タグを生成中です...", className="lookup-message")
        )

    if not children:
        children.append(
            html.Div("タグはまだ生成されていません。", className="lookup-message")
        )

    return html.Div(children, className="card-custom")


def _update_tags(state: Dict[str, Any]) -> Dict[str, Any]:
    items = state["lookup"].get("items") or []
    description = state["front_photo"].get("description")

    print(
        f"DEBUG: _update_tags called - items: {len(items)}, description: {bool(description)}"
    )

    # 4つのパターンを適切に処理
    has_rakuten_data = bool(items)
    has_image_description = bool(description)

    print(
        f"DEBUG: has_rakuten_data: {has_rakuten_data}, has_image_description: {has_image_description}"
    )

    if not has_rakuten_data and not has_image_description:
        state["tags"] = {
            "status": "not_ready",
            "tags": [],
            "message": "バーコード照合または画像説明の結果が揃うとタグを生成します。",
        }
        return state["tags"]

    # IO Intelligence APIでタグを生成
    print("DEBUG: Calling extract_tags...")
    photo_content = state.get("front_photo", {}).get("content")
    tag_result = extract_tags(items, description, photo_content)
    print(f"DEBUG: extract_tags result: {tag_result}")

    # タグ生成結果に応じてメッセージを調整（既にメッセージがあれば優先）
    if tag_result["status"] == "success" and not tag_result.get("message"):
        if has_rakuten_data and has_image_description:
            tag_result["message"] = (
                f"楽天API情報と画像説明から{len(tag_result['tags'])}個のタグを生成しました。"
            )
        elif has_rakuten_data:
            tag_result["message"] = (
                f"楽天API情報から{len(tag_result['tags'])}個のタグを生成しました。"
            )
        elif has_image_description:
            tag_result["message"] = (
                f"画像説明から{len(tag_result['tags'])}個のタグを生成しました。"
            )

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
)
def display_page(pathname: str):
    classes = [
        "nav-link text-white-50",
        "nav-link text-white-50",
        "nav-link text-white-50",
        "nav-link text-white-50",
    ]

    path = pathname or "/"
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")

    if path == "/" or path == "":
        classes[0] = "nav-link active text-white"
        metrics = _fetch_home_metrics()
        page = render_home(metrics["total"], metrics["unique"])
    elif path == "/register":
        classes[1] = "nav-link active text-white"
        page = render_barcode_page()
    elif path == "/register/photo":
        classes[1] = "nav-link active text-white"
        page = render_photo_page()
    elif path == "/register/review":
        classes[1] = "nav-link active text-white"
        page = render_review_page()
    elif path == "/gallery":
        classes[2] = "nav-link active text-white"
        page = render_gallery(_fetch_photos())
    elif path == "/settings":
        classes[3] = "nav-link active text-white"
        page = render_settings(_fetch_total_photos(), load_theme())
    else:
        classes[0] = "nav-link active text-white"
        metrics = _fetch_home_metrics()
        page = render_home(metrics["total"], metrics["unique"])

    return [page, *classes]


@app.callback(
    [
        Output("x-share-config", "style"),
        Output("x-share-count", "children"),
    ],
    [
        Input("btn-x-share", "n_clicks"),
        Input("x-share-textarea", "value"),
    ],
    prevent_initial_call="initial_duplicate",
)
def toggle_x_share(n_clicks, text_value):
    # Show config after first click; keep visible afterwards
    visible = {"display": "block"} if (n_clicks or 0) > 0 else {"display": "none"}
    length = len(text_value) if text_value else 0
    return visible, f"文字数: {length}/280"


@app.callback(
    [
        Output("registration-store", "data", allow_duplicate=True),
        Output("barcode-feedback", "children"),
        Output("url", "pathname", allow_duplicate=True),
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

    print(f"DEBUG: Calling _update_tags after barcode processing")
    _update_tags(state)

    if trigger_id == "barcode-skip-button":
        url = "/register/photo"
    elif state["barcode"]["status"] in {"captured", "manual"}:
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

    return _serialise_state(state), message, url


# 古いprocess_tags関数は削除（インターバルベースに変更）


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
                "model_used": None,
                "description_status": "skipped",
                "vision_source": None,
                "vision_raw": None,
                "structured_data": None,
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

        print("DEBUG: Preparing vision payload for asynchronous processing...")
        print(f"DEBUG: Image contents length: {len(contents) if contents else 0}")

        api_contents = contents
        vision_raw = None
        public_url = None

        if contents:
            try:
                import base64
                from PIL import Image
                import io

                if contents.startswith("data:image"):
                    _, base64_data = contents.split(",", 1)
                    original_bytes = base64.b64decode(base64_data)
                else:
                    original_bytes = base64.b64decode(contents)

                if len(original_bytes) > 100000:  # 100KB以上ならリサイズ
                    print(
                        f"DEBUG: Image is large ({len(original_bytes)} bytes), resizing for vision call..."
                    )
                    image = Image.open(io.BytesIO(original_bytes))
                    max_size = (512, 512)
                    image.thumbnail(max_size, Image.LANCZOS)

                    if image.mode != "RGB":
                        image = image.convert("RGB")

                    output_buffer = io.BytesIO()
                    image.save(output_buffer, format="JPEG", quality=90)
                    file_bytes_for_upload = output_buffer.getvalue()
                    vision_raw = base64.b64encode(file_bytes_for_upload).decode("utf-8")
                    api_contents = f"data:image/jpeg;base64,{vision_raw}"
                    print(f"DEBUG: Resized image for vision payload: {len(api_contents)} bytes")

                    try:
                        public_url = upload_to_storage(
                            supabase,
                            file_bytes_for_upload,
                            filename or "vision_tmp.jpg",
                            "image/jpeg",
                        )
                        if public_url:
                            api_contents = public_url
                            print(f"DEBUG: Using public URL for vision: {public_url}")
                    except Exception as vision_upload_error:
                        print(
                            f"DEBUG: Vision temp upload failed, fallback to data URI: {vision_upload_error}"
                        )
                else:
                    # 元データが十分小さい場合も raw を保持しておく（フォールバック用）
                    vision_raw = base64.b64encode(original_bytes).decode("utf-8")
            except Exception as resize_error:
                print(f"DEBUG: Vision payload preparation failed: {resize_error}")
                api_contents = contents
                vision_raw = None

        # 画像アップロード時にタグ生成フローを開始（非同期処理に移行）
        print(
            f"DEBUG: Tag generation marked as loading - lookup items: {len(state['lookup'].get('items', []))}, photo uploaded: True"
        )
        state["front_photo"]["description"] = None
        state["front_photo"]["model_used"] = None
        state["front_photo"]["structured_data"] = None
        state["front_photo"]["description_status"] = "pending"
        state["front_photo"]["vision_source"] = api_contents
        state["front_photo"]["vision_raw"] = vision_raw

        # 直前までのタグは保持しつつ、ステータスのみ更新
        state["tags"]["status"] = "loading"
        state["tags"]["message"] = "タグを生成中です..."

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
    State("url", "pathname"),
    prevent_initial_call=True,
)
def auto_navigate_on_photo_upload(store_data, current_pathname):
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

    current_path = current_pathname or ""

    # 正面写真が完了したら即レビュー画面へ
    if photo_ready and current_path != "/register/review":
        print(
            f"DEBUG auto_navigate_on_photo_upload: navigating to /register/review (current_path={current_path})"
        )
        return "/register/review"
    # バーコードのみ完了の場合は写真ページに遷移
    if barcode_ready and not photo_ready and current_path != "/register/photo":
        print(
            f"DEBUG auto_navigate_on_photo_upload: navigating to /register/photo (current_path={current_path})"
        )
        return "/register/photo"

    print(
        f"DEBUG auto_navigate_on_photo_upload: not navigating (current_path={current_path})"
    )
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

    # 画像説明（IOインテリジェンスの説明）
    description = state.get("front_photo", {}).get("description")

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

        try:
            # Base64データをデコードして画像を処理
            import base64
            from PIL import Image
            import io

            # data:image/jpeg;base64, の部分を除去
            if content.startswith("data:image"):
                header, base64_data = content.split(",", 1)
                image_data = base64.b64decode(base64_data)
            else:
                image_data = base64.b64decode(content)

            # PILで画像を開く
            image = Image.open(io.BytesIO(image_data))
            print(f"DEBUG: Original image size: {image.size}, mode: {image.mode}")

            # サムネール用にリサイズ（最大200x200に収まるように）
            max_size = (200, 200)
            image.thumbnail(max_size, Image.LANCZOS)
            print(f"DEBUG: Resized image size: {image.size}")

            # RGBモードに変換（JPEG保存のため）
            if image.mode != "RGB":
                image = image.convert("RGB")

            # リサイズした画像をBase64にエンコード
            output_buffer = io.BytesIO()
            image.save(output_buffer, format="JPEG", quality=85)
            resized_base64 = base64.b64encode(output_buffer.getvalue()).decode("utf-8")
            resized_content = f"data:image/jpeg;base64,{resized_base64}"

            print(f"DEBUG: Resized data URL length: {len(resized_content)}")

            # 最終チェック：500KB以内に収まるか
            if len(resized_content) > 512 * 1024:  # 512KB
                print(
                    f"DEBUG: Resized image still too large ({len(resized_content)} bytes), skipping display"
                )
                return ""

            return resized_content

        except Exception as e:
            print(f"DEBUG: Image processing error: {e}")
            # エラーが発生した場合は元のコンテンツを返す（フォールバック）
            # ただしサイズチェックは行う
            if len(content) > 512 * 1024:  # 512KB
                print(
                    f"DEBUG: Original image too large ({len(content)} bytes), skipping display"
                )
                return ""
            return content
    else:
        print("DEBUG: No photo content")
        return ""


@app.callback(
    Output("registration-store", "data", allow_duplicate=True),
    Input("registration-store", "data"),
    prevent_initial_call="initial_duplicate",
)
def process_tags(store_data):
    print(f"DEBUG: process_tags called")
    state = _ensure_state(store_data)
    tags_status = state["tags"].get("status")
    print(f"DEBUG: tags status: {tags_status}")

    if tags_status != "loading":
        print("DEBUG: process_tags skipping - status is not loading")
        raise PreventUpdate

    front_photo = state.get("front_photo", {})
    photo_status = front_photo.get("status")
    description_status = front_photo.get("description_status", "idle")

    # 1. 必要であれば画像説明を生成
    if photo_status == "captured" and description_status == "pending":
        print("DEBUG: process_tags generating image description asynchronously")
        state["front_photo"]["description_status"] = "processing"
        vision_source = front_photo.get("vision_source") or front_photo.get("content")
        vision_raw = front_photo.get("vision_raw")

        try:
            description_result = describe_image(vision_source, raw_base64=vision_raw)
            print(
                f"DEBUG: describe_image result status: {description_result.get('status')}"
            )
        except Exception as io_error:
            print(f"DEBUG: describe_image raised exception inside process_tags: {io_error}")
            import traceback

            print(f"DEBUG: Full traceback: {traceback.format_exc()}")
            state["front_photo"]["description"] = None
            state["front_photo"]["model_used"] = None
            state["front_photo"]["structured_data"] = None
            state["front_photo"]["description_status"] = "error"
        else:
            status = description_result.get("status")
            if status == "success":
                generated_text = (description_result.get("text") or "").strip()
                state["front_photo"]["model_used"] = description_result.get("model_used")
                state["front_photo"]["structured_data"] = description_result.get(
                    "structured_data"
                )

                import re

                has_japanese = bool(
                    re.search(r"[\u3040-\u30ff\u4e00-\u9fff]", generated_text)
                )
                lower_text = generated_text.lower()
                jp_apology_phrases = [
                    "申し訳ありません",
                    "画像が提供されていません",
                    "画像がありません",
                    "画像を提供",
                    "画像を直接確認することができません",
                    "画像を確認することができません",
                    "画像を確認できません",
                    "画像を読み込めません",
                    "指示では画像",
                ]
                invalid = (
                    not generated_text
                    or len(generated_text) < 12
                    or ("ready to help" in lower_text)
                    or ("ready to describe" in lower_text)
                    or ("please provide the image" in lower_text)
                    or ("what's the first photo" in lower_text)
                    or ("how can i" in lower_text)
                    or any(p in generated_text for p in jp_apology_phrases)
                    or not has_japanese
                )

                if invalid:
                    print(
                        f"DEBUG: Generated description judged invalid, keeping None. Preview: '{generated_text[:50]}'"
                    )
                    state["front_photo"]["description"] = None
                else:
                    preview_len = min(300, len(generated_text))
                    print(
                        f"DEBUG: Image description generated successfully (first {preview_len} chars): {generated_text[:preview_len]}"
                    )
                    state["front_photo"]["description"] = generated_text

                state["front_photo"]["description_status"] = "done"
            else:
                print(
                    f"DEBUG: describe_image returned non-success status: {status}, message={description_result.get('message')}"
                )
                state["front_photo"]["description"] = None
                state["front_photo"]["model_used"] = None
                state["front_photo"]["structured_data"] = None
                state["front_photo"]["description_status"] = "error"

    elif photo_status == "captured" and description_status == "processing":
        # 別の呼び出しで処理中の場合は完了を待つ
        print("DEBUG: process_tags found description still processing, skipping this round")
        raise PreventUpdate

    # 2. タグ生成を試みる
    print("DEBUG: Calling _update_tags from process_tags")
    _update_tags(state)
    result = _serialise_state(state)
    print("DEBUG: process_tags completed")
    return result


# STEP4自動反映用のトリガー
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
    print(
        f"DEBUG: tags_data status: {tags_data.get('status')}, tags: {tags_data.get('tags', [])}"
    )

    # デフォルトメッセージ
    tags_display = html.Div(
        "バーコード照合または画像説明の結果が揃うとタグを生成します。",
        className="alert alert-info",
    )

    # タグが1件でもあれば、ステータスに関わらず即表示（逐次反映）
    current_tags = tags_data.get("tags") or []
    if isinstance(current_tags, list) and current_tags:
        tags_display = html.Div(
            [
                html.H5("タグ候補", className="mb-3"),
                html.Div(
                    [
                        html.Span(tag, className="badge bg-secondary me-1 mb-1")
                        for tag in current_tags[:20]
                    ]
                ),
                html.Div(
                    tags_data.get("message", ""),
                    className="text-muted small mt-2",
                ),
                html.Div(
                    f"Vision: {state.get('front_photo', {}).get('model_used') or '-'}",
                    className="text-muted small mt-1",
                ),
            ]
        )

    if not tags_data or tags_data.get("status") == "not_ready":
        pass
    elif tags_data.get("status") == "missing_credentials":
        tags_display = html.Div(
            "IO Intelligence APIキーが設定されていません。",
            className="alert alert-warning",
        )
    elif tags_data.get("status") == "error":
        tags_display = html.Div(
            f"タグ生成エラー: {tags_data.get('message', '不明なエラー')}",
            className="alert alert-danger",
        )
    elif tags_data.get("status") == "success" and tags_data.get("tags"):
        try:
            tags_list = tags_data["tags"]
            if isinstance(tags_list, list) and tags_list:
                # 上の逐次反映表示と同じだが、明示しておく
                tags_display = html.Div(
                    [
                        html.H5("タグ候補", className="mb-3"),
                        html.Div(
                            [
                                html.Span(tag, className="badge bg-secondary me-1 mb-1")
                                for tag in tags_list[:20]
                            ]
                        ),
                        html.Div(
                            tags_data.get("message", ""),
                            className="text-muted small mt-2",
                        ),
                        html.Div(
                            f"Vision: {state.get('front_photo', {}).get('model_used') or '-'}",
                            className="text-muted small mt-1",
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

    from services.io_intelligence import IO_API_KEY, describe_image

    print(f"DEBUG: IO_API_KEY is set: {bool(IO_API_KEY)}")
    if IO_API_KEY:
        print(f"DEBUG: IO_API_KEY length: {len(IO_API_KEY)}")
        print(
            f"DEBUG: IO_API_KEY starts with: {IO_API_KEY[:10] if IO_API_KEY else 'None'}..."
        )

        # 本番では起動時のdescribe_imageテスト呼び出しは行わない
    else:
        print("DEBUG: IO_API_KEY is still not set - this should not happen")

    app.run(host="0.0.0.0", port=port)
