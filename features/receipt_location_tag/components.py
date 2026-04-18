from typing import Any, Dict, List, Optional

import dash_bootstrap_components as dbc
from dash import html, dcc

from services.icon_service import get_receipt_location_icons_sorted
from services.tag_service import (
    get_receipt_location_tags_ordered,
    normalize_receipt_location_icon,
)


def _preview_icon(icon_raw: str, size_class: str = "fs-2") -> html.I:
    ic = normalize_receipt_location_icon(icon_raw or "")
    if ic:
        return html.I(className=f"bi {ic} {size_class} text-body")
    return html.I(
        className=f"bi bi-question-circle {size_class} text-body-secondary"
    )


def _icon_tile_grid(rid_key: Any, icon_rows: List[Dict[str, Any]]) -> html.Div:
    """icon_tag マスタをタイルグリッドにする（title に icon_name）。"""
    tiles = []
    for item in icon_rows:
        ic = (item.get("icon") or "").strip()
        if not ic:
            continue
        label = (item.get("icon_name") or ic).strip()
        tiles.append(
            html.Div(
                dbc.Button(
                    [html.I(className=f"bi {ic}", style={"fontSize": "1.35rem"})],
                    id={"type": "rl-icon-tile", "rid": rid_key, "icon": ic},
                    n_clicks=0,
                    color="light",
                    className="border rounded w-100 py-2 d-flex align-items-center justify-content-center",
                    title=label,
                ),
                className="col-6 col-sm-4 col-md-3 mb-2",
            )
        )
    if not tiles:
        return html.Div(
            "アイコン一覧を読み込めませんでした。",
            className="small text-body-secondary mt-2",
        )
    return html.Div(
        html.Div(tiles, className="row g-1"),
        className="mt-2",
    )


def build_receipt_location_row_blocks(
    rows: list, icon_rows: Optional[List[Dict[str, Any]]] = None
) -> list:
    """Store の行データから入力欄ブロックを生成する。"""
    if icon_rows is None:
        icon_rows = get_receipt_location_icons_sorted()
    row_blocks = []
    n_rows = len(rows)
    for i, row in enumerate(rows):
        rid = row.get("receipt_location_id")
        rid_key = rid if rid is not None else row.get("_key")
        if rid_key is None:
            continue
        icon_val = row.get("receipt_location_icon") or ""
        is_first = i == 0
        is_last = i == n_rows - 1
        toolbar = html.Div(
            [
                dbc.Button(
                    [html.I(className="bi bi-chevron-up")],
                    id={"type": "rl-move", "rid": rid_key, "dir": "up"},
                    n_clicks=0,
                    size="sm",
                    color="secondary",
                    outline=True,
                    className="me-1",
                    disabled=is_first,
                    title="上へ",
                ),
                dbc.Button(
                    [html.I(className="bi bi-chevron-down")],
                    id={"type": "rl-move", "rid": rid_key, "dir": "down"},
                    n_clicks=0,
                    size="sm",
                    color="secondary",
                    outline=True,
                    className="me-1",
                    disabled=is_last,
                    title="下へ",
                ),
                dbc.Button(
                    [html.I(className="bi bi-trash")],
                    id={"type": "rl-delete", "rid": rid_key},
                    n_clicks=0,
                    size="sm",
                    color="danger",
                    outline=True,
                    title="削除",
                ),
            ],
            className="d-flex align-items-center justify-content-end mb-2",
        )
        row_blocks.append(
            html.Div(
                [
                    toolbar,
                    html.Div(
                        [
                            html.Div(
                                id={"type": "rl-icon-preview", "rid": rid_key},
                                children=_preview_icon(icon_val),
                                className="flex-shrink-0 d-flex align-items-center align-self-center",
                                style={"minWidth": "2.5rem"},
                            ),
                            dbc.Input(
                                type="text",
                                id={"type": "rl-name", "rid": rid_key},
                                value=row.get("receipt_location_name") or "",
                                className="form-control",
                                placeholder="収納場所の名前",
                                debounce=False,
                            ),
                        ],
                        className="d-flex align-items-stretch gap-3 mb-2",
                    ),
                    html.Details(
                        [
                            html.Summary(
                                "アイコンを選ぶ",
                                className="small text-primary user-select-none mb-0",
                                style={"cursor": "pointer"},
                            ),
                            _icon_tile_grid(rid_key, icon_rows),
                        ],
                        className="mb-2",
                    ),
                    dcc.Input(
                        id={"type": "rl-icon", "rid": rid_key},
                        type="text",
                        value=icon_val,
                        style={"display": "none"},
                    ),
                ],
                className="d-flex flex-column gap-1 p-3 border rounded mb-2",
            )
        )
    return row_blocks


def render_receipt_location_tags_settings():
    """収納場所タグ設定ページのUI（プリセット6＋追加行）。"""
    rows = get_receipt_location_tags_ordered()
    not_ready = len(rows) == 0
    icon_rows = get_receipt_location_icons_sorted()
    row_blocks = build_receipt_location_row_blocks(rows, icon_rows)

    return html.Div(
        [
            html.Div(
                [
                    html.H1(
                        [html.I(className="bi bi-geo-alt me-2"), "収納場所タグ設定"]
                    ),
                    dcc.Link(
                        [html.I(className="bi bi-arrow-left me-2"), "設定に戻る"],
                        href="/settings",
                        className="btn btn-outline-secondary btn-sm mt-2",
                    ),
                ],
                className="header",
            ),
            html.Div(
                [
                    html.P(
                        "名称とアイコンを設定し、「保存」で反映します。"
                        "「収納場所を追加」で行を増やせます。"
                        "矢印で並び替え、ゴミ箱で削除できます（削除は保存不要で即反映されます）。"
                        "初期表示のプリセット行を削除した場合、その項目は再表示されません。",
                        className="card-text mb-3",
                    ),
                    dcc.Loading(
                        id="receipt-location-actions-loading",
                        type="circle",
                        delay_show=120,
                        delay_hide=200,
                        color="var(--bs-primary, #0d6efd)",
                        className="mt-1",
                        parent_className="position-relative",
                        children=[
                            dcc.Store(id="receipt-location-store", data=rows),
                            html.Div(
                                "初期化中です。ログイン状態を確認してください。"
                                if not_ready
                                else "",
                                className="text-body-secondary small mb-2",
                            ),
                            html.Div(
                                row_blocks,
                                id="receipt-location-rows",
                            ),
                            html.Button(
                                "収納場所を追加",
                                id="receipt-location-add",
                                n_clicks=0,
                                className="btn btn-outline-secondary mb-2 me-2",
                            ),
                            html.Button(
                                "保存",
                                id="receipt-location-save",
                                n_clicks=0,
                                className="btn btn-outline-primary mb-2",
                            ),
                            html.Div(
                                id="receipt-location-save-result",
                                className="mt-2",
                            ),
                        ],
                    ),
                ],
                className="card-custom",
            ),
        ],
        className="page-container",
    )
