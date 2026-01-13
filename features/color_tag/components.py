from dash import html, dcc
from services.tag_service import DEFAULT_COLOR_TAGS, ensure_default_color_tags


def render_color_tags_settings():
    """カラータグ設定ページのUIを生成する。"""
    # ページ表示時にユーザー別の7スロットを作成/取得する（g.user_id が必要）
    tags = ensure_default_color_tags() or []

    # slot 1..7 を必ず描画できるように、デフォルトを土台にして埋める
    by_slot = {int(t.get("slot") or 0): t for t in tags if isinstance(t, dict)}
    slots = []
    for base in DEFAULT_COLOR_TAGS:
        slot = int(base["slot"])
        merged = dict(base)
        merged.update(by_slot.get(slot, {}))
        slots.append(merged)

    not_ready = len(tags) == 0
    return html.Div(
        [
            html.Div(
                [
                    html.H1([html.I(className="bi bi-palette me-2"), "カラータグ設定"]),
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
                        "7色固定です。色と名称を変更して「保存」で更新します。",
                        className="card-text mb-3",
                    ),
                    dcc.Store(id="color-tag-store", data=slots),
                    html.Div(
                        "初期化中です。ログイン状態を確認してください。"
                        if not_ready
                        else "",
                        className="text-body-secondary small mb-2",
                    ),
                    html.Div(
                        [
                            html.Div(
                                [
                                    html.Div(
                                        [
                                            dcc.Input(
                                                type="color",
                                                id={
                                                    "type": "color-tag-color",
                                                    "slot": int(item.get("slot") or 0),
                                                },
                                                value=item.get("color_tag_color")
                                                or "#ffffff",
                                                className="form-control form-control-color",
                                                style={
                                                    "width": "56px",
                                                    "height": "56px",
                                                    "padding": "0",
                                                },
                                            ),
                                            html.Span(
                                                f"slot {item.get('slot')}",
                                                className="small text-body-secondary",
                                            ),
                                        ],
                                        className="d-flex align-items-center gap-2",
                                    ),
                                    html.Div(
                                        [
                                            html.Label(
                                                "名称",
                                                htmlFor={
                                                    "type": "color-tag-name",
                                                    "slot": int(item.get("slot") or 0),
                                                },
                                                className="form-label mb-1",
                                            ),
                                            dcc.Input(
                                                type="text",
                                                id={
                                                    "type": "color-tag-name",
                                                    "slot": int(item.get("slot") or 0),
                                                },
                                                value=item.get("color_tag_name") or "",
                                                className="form-control",
                                                placeholder="色名（例: 赤）",
                                            ),
                                        ],
                                        className="d-flex flex-column",
                                    ),
                                ],
                                className="d-flex flex-column gap-2 p-3 border rounded mb-2",
                            )
                            for item in slots
                        ]
                    ),
                    html.Button(
                        "保存",
                        id="color-tag-save",
                        n_clicks=0,
                        className="btn btn-outline-primary mt-2",
                    ),
                    html.Div(id="color-tag-save-result", className="mt-2"),
                ],
                className="card-custom",
            ),
        ],
        className="page-container",
    )
