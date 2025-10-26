import base64
from typing import Any, Dict, List, Optional

import dash
import dash_bootstrap_components as dbc
from dash import Input, Output, State, callback_context, html, no_update
from dash.exceptions import PreventUpdate

from components.layout import create_app_layout
from components.pages import (
    render_gallery,
    render_home,
    render_register_page,
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
    delete_all_photos,
    insert_photo_record,
    upload_to_storage,
)
from services.supabase_client import get_supabase_client

supabase = get_supabase_client()


def _fetch_home_metrics() -> Dict[str, int]:
    if supabase is None:
        return {"total": 0, "unique": 0}
    try:
        response = supabase.table("photos").select("barcode").execute()
        data = response.data or []
        total = len(data)
        unique = len({item.get("barcode") for item in data if item.get("barcode")})
        return {"total": total, "unique": unique}
    except Exception:
        return {"total": 0, "unique": 0}


def _fetch_photos() -> List[Dict[str, Any]]:
    if supabase is None:
        return []
    try:
        response = (
            supabase.table("photos")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []
    except Exception:
        return []


def _fetch_total_photos() -> int:
    return len(_fetch_photos()) if supabase is not None else 0


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


app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
    meta_tags=[
        {
            "name": "viewport",
            "content": "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
        }
    ],
)
server = app.server

app.title = "写真管理アプリ"
app.layout = create_app_layout()


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
    classes = ["nav-button", "nav-button", "nav-button", "nav-button"]

    if pathname == "/register":
        classes[1] = "nav-button active"
        try:
            page = render_register_page()
        except Exception as e:
            page = html.Div([html.P(f"Error rendering register page: {str(e)}")])
    elif pathname == "/gallery":
        classes[2] = "nav-button active"
        page = render_gallery(_fetch_photos())
    elif pathname == "/settings":
        classes[3] = "nav-button active"
        page = render_settings(_fetch_total_photos())
    else:
        classes[0] = "nav-button active"
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
    prevent_initial_call=True,
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
                    "✅ バーコードを取得しました。",
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
                className="card-custom",
                style={"color": "#ff6b6b"},
            )
        else:
            barcode_value = manual_value.strip()
            lookup_result = lookup_product_by_barcode(barcode_value)
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
                str(exc), className="card-custom", style={"color": "#ff6b6b"}
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
                lookup_result = lookup_product_by_barcode(barcode_value)
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
                message = success_message(barcode_value, barcode_type, lookup_result)

    _update_tags(state)
    return _serialise_state(state), message


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
    prevent_initial_call=True,
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

        preview_card = html.Div(
            [
                html.Div(
                    "✅ 正面写真を取得しました。",
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

        description_result = describe_image(contents)
        description_card: html.Div
        description_text = None

        if description_result.get("status") == "success":
            description_text = description_result.get("text")
            state["front_photo"]["description"] = description_text
            description_card = html.Div(
                [
                    html.Div("IO Intelligence の説明", className="section-subtitle"),
                    html.P(description_text, className="description-text"),
                ],
                className="card-custom",
            )
        else:
            state["front_photo"]["description"] = None
            error_message = (
                description_result.get("message") or "画像説明の生成に失敗しました。"
            )
            description_card = html.Div(
                error_message,
                className="card-custom",
                style={"color": "#ff6b6b"},
            )

        cards = [preview_card, description_card]

        if (
            description_result.get("status") == "success"
            and state["lookup"].get("status") != "success"
        ):
            fallback_lookup = lookup_product_by_keyword(description_text)
            state["lookup"] = fallback_lookup
            cards.append(
                _render_lookup_card(
                    fallback_lookup,
                    title="楽天API (画像説明から検索)",
                )
            )

        message = html.Div(cards)

    _update_tags(state)
    return _serialise_state(state), message


@app.callback(Output("save-button", "disabled"), Input("registration-store", "data"))
def toggle_save_button(data):
    state = _ensure_state(data)
    barcode_ready = state["barcode"]["status"] in {"captured", "manual", "skipped"}
    photo_ready = state["front_photo"]["status"] in {"captured", "skipped"}
    tags_ready = state["tags"]["status"] != "idle"
    return not (barcode_ready and photo_ready and tags_ready)


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
    prevent_initial_call=True,
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
        Input("tag-checklist", "value"),
        Input("note-editor", "value"),
        Input("registration-store", "data"),
    ],
)
def render_review_summary(selected_tags, note_text, store_data):
    state = _ensure_state(store_data)
    selected_tags = selected_tags or state["tags"].get("tags") or []
    note_text = (note_text or "").strip()

    barcode_value = state["barcode"].get("value") or "未取得"
    barcode_type = state["barcode"].get("type") or "不明"

    lookup_items = state["lookup"].get("items") or []
    primary_item = lookup_items[0] if lookup_items else {}
    item_name = primary_item.get("name") or "候補なし"

    description = state["front_photo"].get("description") or ""

    return html.Div(
        [
            html.Div(
                [
                    html.Div("登録内容のまとめ", className="section-subtitle"),
                    html.Ul(
                        [
                            html.Li(f"バーコード: {barcode_value} ({barcode_type})"),
                            html.Li(f"候補商品: {item_name}"),
                            html.Li(
                                f"タグ: {', '.join(selected_tags)}"
                                if selected_tags
                                else "タグ: 未選択"
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
    [
        Output("register-alert", "children"),
        Output("registration-store", "data", allow_duplicate=True),
    ],
    Input("save-button", "n_clicks"),
    State("registration-store", "data"),
    State("front-photo-note", "value"),
    State("tag-checklist", "value"),
    State("note-editor", "value"),
    prevent_initial_call=True,
)
def save_registration(n_clicks, store_data, note, selected_tags, final_note):
    if not n_clicks:
        raise PreventUpdate

    state = _ensure_state(store_data)
    barcode_status = state["barcode"]["status"]
    front_status = state["front_photo"]["status"]

    if barcode_status not in {"captured", "manual", "skipped"}:
        return (
            html.Div(
                "バーコード情報を取得するか、スキップを選択してください。",
                className="alert-custom",
                style={
                    "background": "#fff3cd",
                    "color": "#856404",
                    "border": "1px solid #ffeeba",
                },
            ),
            _serialise_state(state),
        )

    if front_status not in {"captured", "skipped"}:
        return (
            html.Div(
                "正面写真を撮影するか、スキップを選択してください。",
                className="alert-custom",
                style={
                    "background": "#fff3cd",
                    "color": "#856404",
                    "border": "1px solid #ffeeba",
                },
            ),
            _serialise_state(state),
        )

    if supabase is None:
        return (
            html.Div(
                [
                    html.Div(
                        "❌ データベース接続エラー",
                        style={"fontWeight": "600", "marginBottom": "5px"},
                    ),
                    html.Div(
                        ".envファイルでSupabase設定を確認してください",
                        style={"fontSize": "12px"},
                    ),
                ],
                className="alert-custom",
                style={
                    "background": "#f8d7da",
                    "color": "#721c24",
                    "border": "1px solid #f5c6cb",
                },
            ),
            _serialise_state(state),
        )

    selected_tags = selected_tags or state["tags"].get("tags") or []
    final_note = (final_note or note or "").strip()
    try:
        image_url = ""
        if front_status == "captured" and state["front_photo"].get("content"):
            content_string = state["front_photo"]["content"].split(",", 1)[1]
            file_bytes = base64.b64decode(content_string)
            image_url = upload_to_storage(
                supabase,
                file_bytes,
                state["front_photo"].get("filename", "front_photo.jpg"),
                state["front_photo"].get("content_type", "image/jpeg"),
            )

        description_text = final_note
        if selected_tags:
            tags_text = ", ".join(selected_tags)
            description_text = (
                f"{final_note}\nTags: {tags_text}"
                if final_note
                else f"Tags: {tags_text}"
            )

        insert_photo_record(
            supabase,
            state["barcode"].get("value") or "",
            state["barcode"].get("type") or "UNKNOWN",
            image_url or "",
            description_text,
        )
    except Exception as exc:  # pragma: no cover - Supabase例外ハンドリング
        return (
            html.Div(
                [
                    html.Div(
                        "❌ 保存中にエラーが発生しました",
                        style={"fontWeight": "600", "marginBottom": "5px"},
                    ),
                    html.Div(str(exc), style={"fontSize": "12px"}),
                ],
                className="alert-custom",
                style={
                    "background": "#f8d7da",
                    "color": "#721c24",
                    "border": "1px solid #f5c6cb",
                },
            ),
            _serialise_state(state),
        )

    success_message = html.Div(
        [
            html.Div(
                "✅ 登録が完了しました！",
                style={"fontWeight": "600", "marginBottom": "5px"},
            ),
            html.Div(
                f"登録タグ: {', '.join(selected_tags)}"
                if selected_tags
                else "タグ: (なし)",
                style={"marginBottom": "5px"},
            ),
            html.A(
                "写真一覧を見る",
                href="/gallery",
                style={"color": "#ff85b3", "textDecoration": "underline"},
            ),
        ],
        className="alert-custom",
        style={
            "background": "#d4edda",
            "color": "#155724",
            "border": "1px solid #c3e6cb",
        },
    )

    return success_message, _serialise_state(_empty_registration_state())


@app.callback(
    Output("delete-result", "children"), Input("delete-all-button", "n_clicks")
)
def handle_delete(n_clicks):
    if not n_clicks:
        raise PreventUpdate

    if supabase is None:
        return html.Div(
            "❌ データベース接続エラー",
            style={
                "color": "#ff6b6b",
                "fontWeight": "600",
                "textAlign": "center",
                "marginTop": "10px",
            },
        )

    try:
        delete_all_photos(supabase)
    except Exception as exc:  # pragma: no cover - Supabase例外ハンドリング
        return html.Div(
            f"❌ エラー: {exc}",
            style={
                "color": "#ff6b6b",
                "fontWeight": "600",
                "textAlign": "center",
                "marginTop": "10px",
            },
        )

        return html.Div(
            "✅ 全てのデータを削除しました",
            style={
                "color": "#4caf50",
                "fontWeight": "600",
                "textAlign": "center",
                "marginTop": "10px",
            },
        )


if __name__ == "__main__":
    print("")
    print("=" * 60)
    print("📷 写真管理アプリを起動しています...")
    print("=" * 60)
    print("")
    if supabase is None:
        print("⚠️  警告: Supabaseに接続されていません")
        print("    データベース機能を使用するには、.envファイルを設定してください")
        print("")
    print("🌐 ブラウザで以下のURLにアクセスしてください:")
    print("   http://localhost:8050")
    print("")
    print("📱 スマホからアクセスする場合:")
    print("   http://[あなたのPCのIPアドレス]:8050")
    print("")
    print("=" * 60)
    print("")
    app.run(debug=False, host="0.0.0.0", port=8050)
