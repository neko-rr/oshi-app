from typing import Any, Dict, List, Optional

import dash_bootstrap_components as dbc
from dash import html, dcc

from services.icon_service import get_category_icons_sorted
from services.tag_service import (
    get_category_tags_ordered,
    normalize_category_color,
    normalize_category_icon,
)


def _preview_icon(
    icon_raw: str, color_hex: Optional[str] = None, size_class: str = "fs-2"
) -> html.I:
    """アイコン表示。color_hex が有効なら文字色として適用（カラーピッカーと連動）。"""
    ic = normalize_category_icon(icon_raw or "")
    col = (
        normalize_category_color(color_hex)
        if (color_hex and str(color_hex).strip())
        else None
    )
    if ic:
        cls = f"bi {ic} {size_class}"
        if col:
            return html.I(className=cls, style={"color": col})
        return html.I(className=f"{cls} text-body")
    q_cls = f"bi bi-question-circle {size_class} text-body-secondary"
    if col:
        return html.I(className=q_cls, style={"color": col})
    return html.I(className=q_cls)


def _icon_tile_grid(cid_key: Any, icon_rows: List[Dict[str, Any]]) -> html.Div:
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
                    id={"type": "ct-icon-tile", "cid": cid_key, "icon": ic},
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


def build_category_tag_row_blocks(
    rows: list, icon_rows: Optional[List[Dict[str, Any]]] = None
) -> list:
    """Store の行データから入力欄ブロックを生成する。"""
    if icon_rows is None:
        icon_rows = get_category_icons_sorted()
    row_blocks = []
    n_rows = len(rows)
    for i, row in enumerate(rows):
        cid = row.get("category_tag_id")
        cid_key = cid if cid is not None else row.get("_key")
        if cid_key is None:
            continue
        icon_val = row.get("category_tag_icon") or ""
        color_val = normalize_category_color(row.get("category_tag_color") or "") or "#6c757d"
        is_first = i == 0
        is_last = i == n_rows - 1
        toolbar = html.Div(
            [
                dbc.Button(
                    [html.I(className="bi bi-chevron-up")],
                    id={"type": "ct-move", "cid": cid_key, "dir": "up"},
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
                    id={"type": "ct-move", "cid": cid_key, "dir": "down"},
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
                    id={"type": "ct-delete", "cid": cid_key},
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
                                id={"type": "ct-icon-preview", "cid": cid_key},
                                children=_preview_icon(icon_val, color_val),
                                className="flex-shrink-0 d-flex align-items-center align-self-center",
                                style={"minWidth": "2.5rem"},
                            ),
                            dbc.Input(
                                type="text",
                                id={"type": "ct-name", "cid": cid_key},
                                value=row.get("category_tag_name") or "",
                                className="form-control",
                                placeholder="カテゴリ名（例: 本、家庭用）",
                                debounce=False,
                            ),
                            dbc.Input(
                                type="color",
                                id={"type": "ct-color", "cid": cid_key},
                                value=color_val,
                                className="form-control form-control-color flex-shrink-0",
                                style={
                                    "width": "48px",
                                    "height": "48px",
                                    "padding": "0",
                                },
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
                            _icon_tile_grid(cid_key, icon_rows),
                        ],
                        className="mb-2",
                    ),
                    dcc.Input(
                        id={"type": "ct-icon", "cid": cid_key},
                        type="text",
                        value=icon_val,
                        style={"display": "none"},
                    ),
                ],
                className="d-flex flex-column gap-1 p-3 border rounded mb-2",
            )
        )
    return row_blocks


def render_category_tags_settings():
    """カテゴリタグ設定ページのUI（プリセット6＋追加行）。"""
    rows = get_category_tags_ordered()
    not_ready = len(rows) == 0
    icon_rows = get_category_icons_sorted()
    row_blocks = build_category_tag_row_blocks(rows, icon_rows)

    return html.Div(
        [
            html.Div(
                [
                    html.H1(
                        [html.I(className="bi bi-bookmark-heart me-2"), "カテゴリータグ設定"]
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
                        "グッズの種類や用途（本・キーホルダー・家庭用など）を名称・色・アイコンで設定し、「保存」で反映します。"
                        "「カテゴリを追加」で行を増やせます。"
                        "矢印で並び替え、ゴミ箱で削除できます（削除は保存不要で即反映されます）。"
                        "初期表示のプリセット行を削除した場合、その項目は再表示されません。",
                        className="card-text mb-3",
                    ),
                    dcc.Loading(
                        id="category-tag-actions-loading",
                        type="circle",
                        delay_show=120,
                        delay_hide=200,
                        color="var(--bs-primary, #0d6efd)",
                        className="mt-1",
                        parent_className="position-relative",
                        children=[
                            dcc.Store(id="category-tag-store", data=rows),
                            html.Div(
                                "初期化中です。ログイン状態を確認してください。"
                                if not_ready
                                else "",
                                className="text-body-secondary small mb-2",
                            ),
                            html.Div(
                                row_blocks,
                                id="category-tag-rows",
                            ),
                            html.Button(
                                "カテゴリを追加",
                                id="category-tag-add",
                                n_clicks=0,
                                className="btn btn-outline-secondary mb-2 me-2",
                            ),
                            html.Button(
                                "保存",
                                id="category-tag-save",
                                n_clicks=0,
                                className="btn btn-outline-primary mb-2",
                            ),
                            html.Div(
                                id="category-tag-save-result",
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
