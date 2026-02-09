import os
import base64
from typing import Any, Dict, List, Optional
from dash import html, Input, Output, State
from PIL import Image
import io

from components.state_utils import ensure_state
from services.io_intelligence import describe_image


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
        children.append(html.Div("タグを生成中です...", className="lookup-message"))

    if not children:
        children.append(
            html.Div("タグはまだ生成されていません。", className="lookup-message")
        )

    return html.Div(children, className="card-custom")


def register_review_callbacks(app):
    @app.callback(
        Output("color-tag-select", "value"),
        Input("registration-store", "data"),
        prevent_initial_call=False,
    )
    def _sync_color_tag_select(store_data):
        state = ensure_state(store_data)
        return state.get("color_tags", {}).get("selected_slots", []) or []

    @app.callback(
        Output("registration-store", "data", allow_duplicate=True),
        Input("color-tag-select", "value"),
        State("registration-store", "data"),
        prevent_initial_call=True,
    )
    def _update_color_tags(selected, store_data):
        state = ensure_state(store_data)
        state["color_tags"]["selected_slots"] = selected or []
        return state

    @app.callback(
        Output("tag-feedback", "children"), Input("registration-store", "data")
    )
    def render_tag_feedback(store_data):
        state = ensure_state(store_data)
        return _render_tags_card(state["tags"])

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
        from components.ui_components import _render_lookup_card

        state = ensure_state(store_data)
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
                                html.Li(
                                    f"バーコード: {barcode_value} ({barcode_type})"
                                ),
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
                                    f"メモ: {note_text}"
                                    if note_text
                                    else "メモ: (未入力)"
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

        state = ensure_state(store_data)
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
                resized_base64 = base64.b64encode(output_buffer.getvalue()).decode(
                    "utf-8"
                )
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
        state = ensure_state(store_data)
        tags_status = state["tags"].get("status")
        print(f"DEBUG: tags status: {tags_status}")

        if tags_status != "loading":
            print("DEBUG: process_tags skipping - status is not loading")
            from dash.exceptions import PreventUpdate

            raise PreventUpdate

        front_photo = state.get("front_photo", {})
        photo_status = front_photo.get("status")
        description_status = front_photo.get("description_status", "idle")

        # 1. 必要であれば画像説明を生成
        if photo_status == "captured" and description_status == "pending":
            print("DEBUG: process_tags generating image description asynchronously")
            state["front_photo"]["description_status"] = "processing"
            vision_source = front_photo.get("vision_source") or front_photo.get(
                "content"
            )
            vision_raw = front_photo.get("vision_raw")

            try:
                description_result = describe_image(
                    vision_source, raw_base64=vision_raw
                )
                print(
                    f"DEBUG: describe_image result status: {description_result.get('status')}"
                )
                selected_text = (
                    description_result.get("text")
                    or description_result.get("description")
                    or ""
                )
                desc_len = len(selected_text)
                print(f"DEBUG: describe_image description_len: {desc_len}")
            except Exception as io_error:
                print(
                    f"DEBUG: describe_image raised exception inside process_tags: {io_error}"
                )
                import traceback

                print(f"DEBUG: Full traceback: {traceback.format_exc()}")

                state["front_photo"]["description"] = None
                state["front_photo"]["model_used"] = None
                state["front_photo"]["structured_data"] = None
                state["front_photo"]["description_status"] = "error"
                state["tags"]["status"] = "error"
                state["tags"]["message"] = f"画像説明生成エラー: {str(io_error)}"
                from services.state_utils import serialise_state

                return serialise_state(state)

            if description_result.get("status") == "success":
                print("DEBUG: Description generation successful")
                state["front_photo"]["description"] = (
                    description_result.get("text")
                    or description_result.get("description")
                    or None
                )
                state["front_photo"]["model_used"] = description_result.get(
                    "model_used"
                )
                state["front_photo"]["structured_data"] = description_result.get(
                    "structured_data"
                )
                state["front_photo"]["description_status"] = "done"
                print(
                    "DEBUG: front_photo.description_status=done, stored_description_len="
                    f"{len(state['front_photo'].get('description') or '')}"
                )
            else:
                print(f"DEBUG: Description generation failed: {description_result}")
                state["front_photo"]["description"] = None
                state["front_photo"]["model_used"] = None
                state["front_photo"]["structured_data"] = None
                state["front_photo"]["description_status"] = "error"

        # 2. タグ生成を更新
        from services.tag_service import _update_tags

        print("DEBUG: Calling _update_tags from process_tags")
        _update_tags(state)
        result = ensure_state(state)
        print("DEBUG: process_tags completed")
        return result

    @app.callback(
        Output("save-button", "disabled"), Input("registration-store", "data")
    )
    def toggle_save_button(data):
        state = ensure_state(data)
        barcode_ready = state["barcode"]["status"] in {"captured", "manual", "skipped"}
        photo_ready = state["front_photo"]["status"] in {"captured", "skipped"}

        disabled = not (barcode_ready or photo_ready)
        return disabled

    @app.callback(
        [
            Output("tag-checklist", "options", allow_duplicate=True),
            Output("tag-checklist", "value", allow_duplicate=True),
        ],
        Input("registration-store", "data"),
    )
    def update_tags_on_registration_change(store_data):
        from dash import callback_context

        if not callback_context.triggered:
            from dash.exceptions import PreventUpdate

            raise PreventUpdate

        state = ensure_state(store_data)
        tags = state.get("tags", {}).get("tags", [])

        if not tags:
            return [], []

        # タグをチェックリスト形式に変換
        options = [{"label": tag, "value": tag} for tag in tags]
        # デフォルトですべて選択
        values = [tag for tag in tags]

        return options, values

    @app.callback(
        [
            Output("tag-checklist", "value", allow_duplicate=True),
            Output("tag-checklist", "options", allow_duplicate=True),
            Output("custom-tag-input", "value", allow_duplicate=True),
        ],
        Input("tag-add-button", "n_clicks"),
        State("custom-tag-input", "value"),
        State("tag-checklist", "value"),
        State("tag-checklist", "options"),
        prevent_initial_call="initial_duplicate",
    )
    def add_custom_tag(n_clicks, tag_value, current_value, options):
        if not n_clicks or not tag_value or not tag_value.strip():
            from dash.exceptions import PreventUpdate

            raise PreventUpdate

        tag_value = tag_value.strip()
        if tag_value in [opt["value"] for opt in options]:
            # 既に存在するタグの場合は何もしない
            return current_value, options, ""

        # 新しいタグを追加
        new_option = {"label": tag_value, "value": tag_value}
        new_options = options + [new_option]
        new_value = current_value + [tag_value] if current_value else [tag_value]

        return new_value, new_options, ""

    @app.callback(
        Output("register-alert", "children", allow_duplicate=True),
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
        prevent_initial_call="initial_duplicate",
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
        from services.registration_service import (
            save_registration as _save_registration,
        )

        return _save_registration(
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
        )

    @app.callback(
        [
            Output("rakuten-lookup-display", "children"),
            Output("io-intelligence-tags-display", "children"),
        ],
        [
            Input("registration-store", "data"),
            State("_pages_location", "pathname"),
        ],
    )
    def display_api_results(store_data, pathname):
        """レビュー画面で楽天APIとIO Intelligenceの結果を表示"""
        print(f"DEBUG: display_api_results called")
        print(
            f"DEBUG: store_data keys: {list(store_data.keys()) if store_data else 'None'}"
        )

        # Step3 以外では描画しない
        if pathname != "/register/review":
            raise PreventUpdate

        state = ensure_state(store_data)

        # 楽天API結果の表示
        lookup_data = state.get("lookup", {})
        from components.ui_components import _render_lookup_card

        rakuten_display = _render_lookup_card(lookup_data, title="楽天API照合結果")

        # IO Intelligenceタグ結果の表示
        tags_data = state.get("tags", {})
        io_display = _render_tags_card(tags_data)

        return rakuten_display, io_display

    @app.callback(
        Output("auto-fill-trigger", "children"),
        Input("_pages_location", "pathname"),
        prevent_initial_call="initial_duplicate",
    )
    def trigger_auto_fill_on_page_change(pathname):
        """ページ遷移時に自動反映をトリガー"""
        if pathname == "/register/review":
            print("DEBUG: Triggering auto-fill for review page")
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
        State("_pages_location", "pathname"),
        prevent_initial_call="initial_duplicate",
    )
    def auto_fill_form_from_tags(trigger, store_data, pathname):
        """STEP4でページ遷移後にタグから自動でフォームを埋める"""
        print(
            f"DEBUG: auto_fill_form_from_tags called (trigger: {trigger}, pathname: {pathname})"
        )

        # STEP4のページのみ処理
        if pathname != "/register/review" or not trigger:
            print("DEBUG: Not on register page or no trigger, skipping")
            return [""] * 7

        if not store_data:
            print("DEBUG: No store data")
            return [""] * 7

        state = ensure_state(store_data)

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
                for keyword in [
                    "bangdream",
                    "lovelive",
                    "idol",
                    "music",
                    "band",
                    "series",
                ]
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
