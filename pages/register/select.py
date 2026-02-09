from dash import (
    Input,
    Output,
    State,
    callback,
    callback_context,
    html,
    no_update,
    register_page,
)

from components.state_utils import empty_registration_state, ensure_state, serialise_state


def _card(title: str, description: str, button_id: str, color: str, disabled: bool) -> html.Div:
    """分岐カードの簡易UI"""
    return html.Div(
        [
            html.Div(title, className="card-title fw-semibold mb-2"),
            html.P(description, className="card-text text-muted"),
            html.Button(
                "このフローを開始する",
                id=button_id,
                className="btn btn-primary",
                style={"backgroundColor": color, "borderColor": color},
                disabled=disabled,
            ),
        ],
        className="card-custom h-100",
    )


def render_select_page() -> html.Div:
    return html.Div(
        [
            html.Div(
                [html.H1([html.I(className="bi bi-diagram-3 me-2"), "登録方法を選択"])],
                className="header",
            ),
            html.Div(
                [
                    html.P(
                        "利用したい登録方法を選択してください。現時点では「グッズ登録（写真・タグ付け）」のみ利用できます。",
                        className="text-muted",
                    )
                ],
                className="mb-3",
            ),
            html.Div(
                [
                    html.Div(
                        _card(
                            title="グッズ登録（クイック追加：写真撮影のみ）",
                            description="バーコードまたは正面写真のどちらかで登録できます。タグ生成は行いません。",
                            button_id="select-quick",
                            color="#3f86ff",
                            disabled=False,
                        ),
                        className="col-md-4 mb-3",
                    ),
                    html.Div(
                        _card(
                            title="グッズ登録（写真・タグ付け）",
                            description="バーコード→写真→レビュー（タグ付け）で登録します。",
                            button_id="select-full",
                            color="#28a745",
                            disabled=False,
                        ),
                        className="col-md-4 mb-3",
                    ),
                    html.Div(
                        _card(
                            title="書籍登録（準備中）",
                            description="書籍向けフローは準備中です。実装完了までお待ちください。",
                            button_id="select-book",
                            color="#6c757d",
                            disabled=True,
                        ),
                        className="col-md-4 mb-3",
                    ),
                ],
                className="row",
            ),
            html.Div(id="select-feedback", className="mt-3"),
        ],
        className="container-xl",
        style={"padding": "20px"},
    )


register_page(
    __name__,
    path="/register/select",
    title="登録方法を選択 - おしごとアプリ",
)

layout = render_select_page()


def _init_flow_state(flow: str) -> dict:
    state = empty_registration_state()
    state["meta"]["flow"] = flow
    state["meta"]["flow_source"] = "select-quick" if flow == "goods_quick" else "select-full"
    state["meta"]["last_save_message"] = None
    state["meta"]["last_save_status"] = None
    return state


def _info(message: str) -> html.Div:
    return html.Div(message, className="alert alert-info", role="alert")


@callback(
    [
        Output("registration-store", "data", allow_duplicate=True),
        Output("_pages_location", "pathname", allow_duplicate=True),
        Output("select-feedback", "children"),
    ],
    [
        Input("select-quick", "n_clicks"),
        Input("select-full", "n_clicks"),
        Input("select-book", "n_clicks"),
    ],
    State("registration-store", "data"),
    prevent_initial_call=True,
)
def handle_select(quick, full, book, store_data):
    triggered = callback_context.triggered
    state = ensure_state(store_data)

    if not triggered:
        return serialise_state(state), no_update, no_update

    trigger_id = triggered[0]["prop_id"].split(".")[0]

    if trigger_id == "select-full":
        new_state = _init_flow_state("goods_full")
        return serialise_state(new_state), "/register/barcode", _info(
            "写真・タグ付けフローを開始します。バーコード取得画面へ移動します。"
        )

    if trigger_id == "select-quick":
        new_state = _init_flow_state("goods_quick")
        return serialise_state(new_state), "/register/barcode", _info(
            "クイック追加フローを開始します。バーコードまたは正面写真のいずれかで登録できます。"
        )

    if trigger_id == "select-book":
        message = "書籍登録は現在準備中です。"
        return serialise_state(state), no_update, _info(message)

    return serialise_state(state), no_update, no_update

