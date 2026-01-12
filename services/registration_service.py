import base64
import os
import gc
from typing import Any, Dict
from dash import html
from dash.exceptions import PreventUpdate

from components.state_utils import ensure_state, serialise_state
from services.photo_service import insert_photo_record, upload_to_storage
from services.supabase_client import get_supabase_client

try:
    from flask import g, has_app_context
except Exception:  # pragma: no cover
    g = None
    has_app_context = lambda: False  # type: ignore


def _current_members_id() -> str:
    """flask.g から現在のユーザーIDを取得。無ければ例外にして保存を止める。"""
    if g is None or not has_app_context():
        raise RuntimeError("メンバーIDが取得できません（未ログイン）。")
    uid = getattr(g, "user_id", None)
    if not uid:
        raise RuntimeError("メンバーIDが取得できません（未ログイン）。")
    return str(uid)


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

    supabase = get_supabase_client()
    members_id = None
    try:
        members_id = _current_members_id()
    except Exception as e:
        return html.Div(f"ログイン情報が取得できません: {str(e)}", className="alert alert-danger")

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
        state = ensure_state(store_data)
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
        front_photo_state = state.get("front_photo", {})
        original_tmp_path = front_photo_state.get("original_tmp_path")
        display_content = front_photo_state.get("content")

        if original_tmp_path or display_content:
            print("Starting photo processing...")
            try:
                # Supabase Storageを使用
                if original_tmp_path and os.path.exists(original_tmp_path):
                    with open(original_tmp_path, "rb") as original_file:
                        file_bytes = original_file.read()
                else:
                    if display_content and "," in display_content:
                        content_string = display_content.split(",", 1)[1]
                        file_bytes = base64.b64decode(content_string)
                    else:
                        raise ValueError(
                            "Preview photo data is not available for upload."
                        )

                # photoレコードを作成
                print("Inserting photo record...")
                photo_id = insert_photo_record(
                    supabase,
                    members_id=members_id,
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
                            {
                                "photo_high_resolution_url": image_url,
                                "photo_thumbnail_url": image_url,
                            }
                        ).eq("photo_id", photo_id).eq("members_id", members_id).execute()
                        print("Photo record updated with URL")

            except Exception as photo_error:
                print(f"Photo processing failed: {photo_error}")
                # 写真保存失敗でも製品登録は続行（photo_id = None）
            finally:
                if "file_bytes" in locals():
                    del file_bytes
                if original_tmp_path and os.path.exists(original_tmp_path):
                    try:
                        os.remove(original_tmp_path)
                        state["front_photo"]["original_tmp_path"] = None
                    except Exception as cleanup_error:
                        print(
                            f"DEBUG: Failed to remove temp photo file after upload: {cleanup_error}"
                        )
                gc.collect()
        else:
            print("No photo content found, skipping photo processing")

        print(f"Final photo_id: {photo_id}")

        # 製品情報の保存 - Supabaseを使用（ローカルDB分岐削除）
        from services.photo_service import insert_product_record
        insert_product_record(
            supabase,
            members_id=members_id,
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


def save_quick_registration_with_photo(store_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    クイック追加: 写真ありで保存する
    - photo を保存し、product を作成する
    - UI要素は返さず、純データのみ返す
    """
    state = ensure_state(store_data)
    front_photo_state = state.get("front_photo", {})

    has_photo = bool(front_photo_state.get("original_tmp_path")) or bool(
        front_photo_state.get("content")
    )
    if not has_photo:
        return {
            "status": "business_error",
            "message": "正面写真がありません。撮影またはアップロードしてください。",
            "photo_id": None,
            "product_name": None,
            "state": serialise_state(state),
        }

    supabase = get_supabase_client()
    members_id = _current_members_id()

    photo_id = None
    product_name = f"未設定_{__import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S')}"

    try:
        file_bytes = None
        content_type = front_photo_state.get("content_type", "image/jpeg")
        original_tmp_path = front_photo_state.get("original_tmp_path")
        display_content = front_photo_state.get("content")

        # 画像バイトを取得
        if original_tmp_path and os.path.exists(original_tmp_path):
            with open(original_tmp_path, "rb") as f:
                file_bytes = f.read()
        else:
            if display_content and "," in display_content:
                content_string = display_content.split(",", 1)[1]
                file_bytes = base64.b64decode(content_string)
            else:
                return {
                    "status": "business_error",
                    "message": "写真データが取得できませんでした。撮影をやり直してください。",
                    "photo_id": None,
                    "product_name": None,
                    "state": serialise_state(state),
                }

        # photoレコード作成
        photo_id = insert_photo_record(
            supabase,
            members_id=members_id,
            image_url="",
            thumbnail_url="",
            front_flag=1,
        )

        # ストレージアップロード
        image_url = upload_to_storage(
            supabase,
            file_bytes,
            f"photo_{photo_id}.jpg",
            content_type,
        )

        if image_url and photo_id:
            supabase.table("photo").update(
                {
                    "photo_high_resolution_url": image_url,
                    "photo_thumbnail_url": image_url,
                }
            ).eq("photo_id", photo_id).eq("members_id", members_id).execute()

        # productレコード作成（バーコードがなくても登録可）
        from services.photo_service import insert_product_record

        insert_product_record(
            supabase,
            photo_id=photo_id,
            barcode=state["barcode"].get("value") or "",
            barcode_type=state["barcode"].get("type") or "UNKNOWN",
            product_name=product_name,
            product_group_name="",
            works_series_name="",
            title="",
            character_name="",
            purchase_price=None,
            purchase_location="",
            memo="",
        )

        return {
            "status": "success",
            "message": "写真を保存しました。",
            "photo_id": photo_id,
            "product_name": product_name,
            "state": serialise_state(state),
        }
    except Exception as e:
        return {
            "status": "system_error",
            "message": f"保存中にエラーが発生しました: {str(e)}",
            "photo_id": photo_id,
            "product_name": product_name,
            "state": serialise_state(state),
        }
    finally:
        try:
            if "file_bytes" in locals():
                del file_bytes
            if original_tmp_path and os.path.exists(original_tmp_path):
                os.remove(original_tmp_path)
                state["front_photo"]["original_tmp_path"] = None
        except Exception:
            pass
        gc.collect()


def save_quick_registration_barcode_only(store_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    クイック追加: バーコードのみで保存する（photo_idは持たない）
    - バーコードがなければ業務エラー
    - UI要素は返さず、純データのみ返す
    """
    state = ensure_state(store_data)
    barcode_value = state["barcode"].get("value")

    if not barcode_value:
        return {
            "status": "business_error",
            "message": "バーコードまたは正面写真のどちらかが必要です。",
            "photo_id": None,
            "product_name": None,
            "state": serialise_state(state),
        }

    supabase = get_supabase_client()
    product_name = f"未設定_{__import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S')}"

    try:
        from services.photo_service import insert_product_record

        insert_product_record(
            supabase,
            photo_id=None,
            barcode=barcode_value,
            barcode_type=state["barcode"].get("type") or "UNKNOWN",
            product_name=product_name,
            product_group_name="",
            works_series_name="",
            title="",
            character_name="",
            purchase_price=None,
            purchase_location="",
            memo="",
        )

        return {
            "status": "success",
            "message": "バーコードのみで登録しました。",
            "photo_id": None,
            "product_name": product_name,
            "state": serialise_state(state),
        }
    except Exception as e:
        return {
            "status": "system_error",
            "message": f"保存中にエラーが発生しました: {str(e)}",
            "photo_id": None,
            "product_name": product_name,
            "state": serialise_state(state),
        }
