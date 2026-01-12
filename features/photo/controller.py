import os
import gc
import tempfile
from dash import html, callback_context, no_update, Input, Output, State
from dash.exceptions import PreventUpdate

from components.state_utils import ensure_state, serialise_state, empty_registration_state
from services.photo_service import upload_to_storage
from services.supabase_client import get_supabase_client
from services.registration_service import (
    save_quick_registration_with_photo,
    save_quick_registration_barcode_only,
)


def register_photo_callbacks(app):
    @app.callback(
        [
            Output("registration-store", "data", allow_duplicate=True),
            Output("front-feedback", "children"),
            Output("_pages_location", "pathname", allow_duplicate=True),
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
        state = ensure_state(store_data)
        flow = state.get("meta", {}).get("flow") or "goods_full"
        message = no_update
        nav_path = no_update

        def _cleanup_temp_file() -> None:
            tmp_path = state.get("front_photo", {}).get("original_tmp_path")
            if tmp_path and isinstance(tmp_path, str):
                try:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                except Exception as cleanup_error:
                    print(
                        f"DEBUG: Failed to remove temp file '{tmp_path}': {cleanup_error}"
                    )
            state["front_photo"]["original_tmp_path"] = None
            gc.collect()

        if trigger_id == "front-skip-button":
            _cleanup_temp_file()
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
                    "original_tmp_path": None,
                }
            )
            message = ""
            print("DEBUG handle_front_photo: photo skipped")

            if flow == "goods_full":
                nav_path = "/register/review"
            else:
                # goods_quick: 写真なしでスキップ
                barcode_value = state["barcode"].get("value")
                if barcode_value:
                    result = save_quick_registration_barcode_only(serialise_state(state))
                    status = result.get("status")
                    result_state = result.get("state", serialise_state(state))
                    if status == "success":
                        new_state = empty_registration_state()
                        new_state["meta"]["flow"] = "goods_quick"
                        new_state["meta"]["last_save_message"] = result.get("message")
                        new_state["meta"]["last_save_status"] = status
                        message = html.Div(result.get("message"), className="alert alert-success")
                        nav_path = "/register/barcode"
                        return serialise_state(new_state), message, nav_path
                    if status == "business_error":
                        message = html.Div(result.get("message"), className="alert alert-danger")
                        nav_path = no_update
                        return result_state, message, nav_path
                    message = html.Div(result.get("message"), className="alert alert-danger")
                    nav_path = no_update
                    return result_state, message, nav_path
                else:
                    # 両方なし → 登録せず barcode へ戻して注意喚起
                    new_state = empty_registration_state()
                    new_state["meta"]["flow"] = "goods_quick"
                    new_state["meta"]["last_save_message"] = "バーコードまたは正面写真のどちらかが必要です。"
                    new_state["meta"]["last_save_status"] = "business_error"
                    nav_path = "/register/barcode"
                    return serialise_state(new_state), message, nav_path
        else:
            contents = (
                camera_contents
                if trigger_id == "front-camera-upload"
                else upload_contents
            )
            filename = (
                camera_filename
                if trigger_id == "front-camera-upload"
                else upload_filename
            )
            if not contents:
                raise PreventUpdate

            _cleanup_temp_file()

            header = contents.split(",", 1)[0]
            content_type = header.replace("data:", "").split(";")[0]
            state["front_photo"].update(
                {
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
            display_data_url = contents

            if contents:
                original_bytes = None
                try:
                    import base64
                    from PIL import Image
                    import io

                    # Pillow のバージョン差異を吸収（pyright対策も兼ねる）
                    from typing import Any, cast

                    resample = cast(
                        Any, getattr(getattr(Image, "Resampling", Image), "LANCZOS")
                    )

                    if contents.startswith("data:image"):
                        _, base64_data = contents.split(",", 1)
                        original_bytes = base64.b64decode(base64_data)
                    else:
                        original_bytes = base64.b64decode(contents)

                    preview_bytes = None
                    preview_buffer = None
                    try:
                        preview_image = Image.open(io.BytesIO(original_bytes))
                        preview_image.thumbnail((256, 256), resample)
                        preview_buffer = io.BytesIO()
                        preview_image.save(preview_buffer, format="JPEG", quality=70)
                        preview_bytes = preview_buffer.getvalue()
                        preview_b64 = base64.b64encode(preview_bytes).decode("utf-8")
                        display_data_url = f"data:image/jpeg;base64,{preview_b64}"
                        preview_image.close()
                    except Exception as preview_error:
                        preview_bytes = None
                        display_data_url = contents
                        print(
                            f"DEBUG: Failed to generate preview image: {preview_error}"
                        )
                    finally:
                        if preview_bytes is not None:
                            del preview_bytes
                        if preview_buffer is not None:
                            del preview_buffer
                        gc.collect()

                    reduced_bytes_for_vision = original_bytes
                    vision_buffer = None
                    try:
                        vision_image = Image.open(io.BytesIO(original_bytes))
                        vision_image.thumbnail((384, 384), resample)
                        vision_buffer = io.BytesIO()
                        vision_image.save(vision_buffer, format="JPEG", quality=85)
                        reduced_bytes_for_vision = vision_buffer.getvalue()
                        vision_image.close()
                    except Exception as reduce_error:
                        print(
                            f"DEBUG: Failed to reduce image for vision payload: {reduce_error}"
                        )
                    finally:
                        if vision_buffer is not None:
                            del vision_buffer
                        gc.collect()

                    temp_file_path = None
                    try:
                        with tempfile.NamedTemporaryFile(
                            delete=False, prefix="front_photo_", suffix=".jpg"
                        ) as tmp_file:
                            tmp_file.write(original_bytes)
                            temp_file_path = tmp_file.name
                    except Exception as tmp_error:
                        print(
                            f"DEBUG: Failed to persist original photo to temp file: {tmp_error}"
                        )
                    state["front_photo"]["original_tmp_path"] = temp_file_path

                    vision_raw = base64.b64encode(reduced_bytes_for_vision).decode(
                        "utf-8"
                    )
                    api_contents = f"data:image/jpeg;base64,{vision_raw}"
                    print(
                        f"DEBUG: Vision payload prepared (len={len(api_contents)} bytes, reduced resolution)"
                    )

                    # Private運用のため、vision用の一時アップロードは行わない（data URI を優先）
                    public_url = None
                    del reduced_bytes_for_vision
                    gc.collect()
                except Exception as resize_error:
                    print(f"DEBUG: Vision payload preparation failed: {resize_error}")
                    api_contents = contents
                    vision_raw = None
                finally:
                    if original_bytes is not None:
                        del original_bytes
                    gc.collect()

            # goods_full と goods_quick で処理を分岐
            if flow == "goods_full":
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
                            src=display_data_url,
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
                state["front_photo"]["content"] = display_data_url

                cards = [preview_card]
                message = html.Div(cards)
                print(
                    f"DEBUG handle_front_photo: photo processing started, status={state['front_photo']['status']}"
                )

                print("DEBUG handle_front_photo: photo uploaded successfully")
                nav_path = "/register/review"
            else:
                # goods_quick: ここで即保存（タグ生成はスキップ）
                state["front_photo"]["content"] = display_data_url

                result = save_quick_registration_with_photo(serialise_state(state))
                status = result.get("status")
                result_state = result.get("state", serialise_state(state))

                if status == "success":
                    new_state = empty_registration_state()
                    new_state["meta"]["flow"] = "goods_quick"
                    new_state["meta"]["last_save_message"] = result.get("message")
                    new_state["meta"]["last_save_status"] = status
                    message = html.Div(result.get("message"), className="alert alert-success")
                    nav_path = "/register/barcode"
                    return serialise_state(new_state), message, nav_path

                if status == "business_error":
                    message = html.Div(result.get("message"), className="alert alert-danger")
                    nav_path = no_update
                    return result_state, message, nav_path

                message = html.Div(
                    result.get("message", "保存中にエラーが発生しました。"),
                    className="alert alert-danger",
                )
                nav_path = no_update
                return result_state, message, nav_path

        print(f"DEBUG handle_front_photo: returning nav_path={nav_path}")
        return serialise_state(state), message, nav_path


def register_x_share_callbacks(app):
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
        """Xシェア機能の切り替え"""
        if n_clicks and text_value:
            return {"display": "block"}, f"文字数: {len(text_value)}"
        return {"display": "none"}, "準備中"
