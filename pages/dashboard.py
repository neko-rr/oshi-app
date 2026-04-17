from dash import html, dcc, callback, Input, Output, State, register_page
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import random


def create_storage_chart_data() -> dict:
    """収納場所タグ × 製品種類（プレゼン用・乱数）のデータを生成する。"""
    product_types = ["ポストカード", "缶バッチ", "アクリルスタンド"]
    storage_tags = ["クリアファイル", "タンス", "ディスプレイ"]
    colors = {
        "クリアファイル": "#0d6efd",
        "タンス": "#6c757d",
        "ディスプレイ": "#ffc107",
    }
    counts = {tag: [random.randint(2, 12) for _ in product_types] for tag in storage_tags}

    # 余り数は「全数より少ない」ことを保証（最大で全数の半分）
    surplus = {}
    flags = {}
    for tag in storage_tags:
        surplus_list = []
        flags_list = []
        for base in counts[tag]:
            max_extra = max(0, base // 2)
            extra = random.randint(0, max_extra)
            surplus_list.append(extra)
            flags_list.append(extra > 0)
        surplus[tag] = surplus_list
        flags[tag] = flags_list

    return {
        "product_types": product_types,
        "storage_tags": storage_tags,
        "colors": colors,
        "counts": counts,
        "surplus": surplus,
        "flags": flags,
    }


def create_storage_location_chart_from_data(data: dict, show_surplus: bool) -> go.Figure:
    """収納場所タグ × 製品種類の棒グラフを生成する。"""
    product_types = data["product_types"]
    storage_tags = data["storage_tags"]
    colors = data["colors"]
    counts = data["counts"]
    surplus = data.get("surplus") or {tag: [0] * len(product_types) for tag in storage_tags}
    flags = data["flags"]

    fig = go.Figure()
    for tag in storage_tags:
        base_vals = counts[tag]
        extra_vals = surplus.get(tag, [0] * len(product_types))

        # ON時は「余り」だけ、OFF時は全数
        y_vals = [
            extra_vals[i] if show_surplus else base_vals[i] for i in range(len(product_types))
        ]
        tag_flags = flags[tag]
        texts = [("余" if (show_surplus and tag_flags[i]) else "") for i in range(len(product_types))]
        hover_flags = [
            ("あり (" + str(extra_vals[i]) + ")" if tag_flags[i] else "なし")
            for i in range(len(product_types))
        ]

        fig.add_bar(
            name=tag,
            x=product_types,
            y=y_vals,
            marker_color=colors[tag],
            text=texts,
            textposition="outside",
            cliponaxis=False,
            customdata=hover_flags,
            hovertemplate="%{x}<br>%{y} 個<br>余り: %{customdata}<extra>" + tag + "</extra>",
        )

    fig.update_layout(
        title="収納場所タグ × 製品種類（プレゼン用・乱数）",
        xaxis_title="製品種類",
        yaxis_title="個数",
        barmode="group",
        legend_title_text="収納場所タグ",
        margin=dict(l=20, r=20, t=40, b=20),
        height=320,
    )
    return fig


def render_dashboard() -> html.Div:
    storage_chart_data = create_storage_chart_data()

    header = html.Div(
        [html.H1([html.I(className="bi bi-speedometer2 me-2"), "ダッシュボード"])],
        className="header",
    )

    storage_chart_card = html.Div(
        [
            html.H4("収納場所タグ 集計", className="mb-2"),
            dbc.Switch(
                id="dashboard-surplus-toggle",
                label="余りフラグを表示（ダブり把握）",
                value=False,
                className="mb-2",
            ),
            html.Button(
                "グラフを表示（Plotly を読み込みます）",
                id="dashboard-show-chart",
                className="btn btn-outline-primary btn-sm mb-2",
                n_clicks=0,
            ),
            dcc.Store(id="dashboard-storage-chart-data", data=storage_chart_data),
            html.Div(
                html.P(
                    "ボタンを押すとグラフが表示されます（未表示時は Plotly を読み込みません）。",
                    className="text-muted small mb-0",
                ),
                id="dashboard-graph-slot",
                className="w-100",
            ),
        ],
        className="card p-4 mb-4",
    )

    return html.Div([header, storage_chart_card])


@callback(
    Output("dashboard-graph-slot", "children"),
    Input("dashboard-show-chart", "n_clicks"),
    Input("dashboard-surplus-toggle", "value"),
    State("dashboard-storage-chart-data", "data"),
    prevent_initial_call=True,
)
def _dashboard_chart_slot(n_clicks, show_surplus, data: dict):
    """Plotly は「表示」クリック後にのみマウント。スイッチ変更で再描画する。"""
    if not n_clicks:
        return html.P(
            "ボタンを押すとグラフが表示されます（未表示時は Plotly を読み込みません）。",
            className="text-muted small mb-0",
        )
    data = data or {}
    fig = create_storage_location_chart_from_data(data, bool(show_surplus))
    return dcc.Graph(
        id="dashboard-storage-chart",
        figure=fig,
        config={"displayModeBar": False, "responsive": True, "autosizable": True},
        className="border rounded w-100",
        style={"height": "320px"},
    )


register_page(
    __name__,
    path="/dashboard",
    title="ダッシュボード - おしごとアプリ",
)

try:
    layout = render_dashboard()
except Exception as e:
    layout = html.Div(
        f"Dashboard page error: {str(e)}", style={"color": "red", "padding": "20px"}
    )
