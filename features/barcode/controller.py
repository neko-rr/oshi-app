from typing import Any, Dict, List, Optional
from dash import html, callback_context, no_update, Input, Output, State
from dash.exceptions import PreventUpdate

from components.state_utils import (
    ensure_state,
    empty_registration_state,
    serialise_state,
)
from services.barcode_lookup import lookup_product_by_barcode
from services.barcode_service import decode_from_base64
from services.tag_extraction import extract_tags


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
    if tag_result.get("status") == "success":
        message = tag_result.get("message", "タグを生成しました。")
        if has_rakuten_data and has_image_description:
            message = "バーコード照合結果と画像説明の両方からタグを生成しました。"
        elif has_rakuten_data:
            message = "バーコード照合結果からタグを生成しました。"
        elif has_image_description:
            message = "画像説明からタグを生成しました。"
        tag_result["message"] = message

    state["tags"] = tag_result
    return state["tags"]


def register_barcode_callbacks(app):
    @app.callback(
        [
            Output("registration-store", "data", allow_duplicate=True),
            Output("barcode-feedback", "children"),
            Output("nav-redirect", "pathname", allow_duplicate=True),
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
        state = ensure_state(store_data)
        message = no_update
        nav_path = no_update

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
                "message": "",
                "source": "skip",
                "keyword": None,
            }
            message = ""
        elif trigger_id == "barcode-retry-button":
            state["barcode"] = empty_registration_state()["barcode"].copy()
            state["lookup"] = empty_registration_state()["lookup"].copy()
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
                    print(
                        f"DEBUG: Decoded barcode: {barcode_value}, type: {barcode_type}"
                    )
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
                    message = success_message(
                        barcode_value, barcode_type, lookup_result
                    )

        print(f"DEBUG: Calling _update_tags after barcode processing")
        _update_tags(state)

        url = no_update  # 遷移は store リスナーに任せる
        if state["barcode"]["status"] in ["captured", "error"]:
            message = html.Div(
                [
                    message,
                    html.Button("もう一度挑戦する", id="barcode-retry-button"),
                    html.Button("スキップ", id="barcode-skip-button"),
                ]
            )

        return serialise_state(state), message, url
