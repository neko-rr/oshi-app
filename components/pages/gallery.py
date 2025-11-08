from dash import html
from dash import dcc
from dash import callback, Output, Input, State
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
from typing import Iterable, Mapping
import random

Photo = Mapping[str, str]


def render_gallery(photos: Iterable[Photo]) -> html.Div:
    photos = list(photos)
    TARGET_CARD_COUNT = 8  # ダミーカードを含めた表示枚数（見かけだけ）

    # 不足分をダミーで補完
    if len(photos) < TARGET_CARD_COUNT:
        for i in range(TARGET_CARD_COUNT - len(photos)):
            photos.append({
                "image_url": None,
                "barcode": "DUMMY",
                "description": None,
                "tags": None,
                "_dummy": True,
            })

    # ヘッダー
    header = html.Div([html.H1([html.I(className="bi bi-speedometer2 me-2"), "ダッシュボード"])], className="header")

    # デモ用グラフデータ
    def create_category_pie_chart():
        """カテゴリ別商品数の円グラフ"""
        labels = ['キーホルダー', '缶バッジ', 'アクリルスタンド', 'その他']
        values = [0, 0, 0, 0]  # デモ用に全て0

        fig = go.Figure(data=[go.Pie(
            labels=labels,
            values=values,
            marker_colors=['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4'],
            title="商品カテゴリ分布"
        )])

        fig.update_layout(
            font_family="Arial",
            font_size=12,
            margin=dict(l=20, r=20, t=40, b=20),
            height=250  # 高さを少し小さく
        )

        return fig

    def create_monthly_bar_chart():
        """月別収集数の棒グラフ"""
        months = ['1月', '2月', '3月', '4月', '5月', '6月']
        counts = [0, 0, 0, 0, 0, 0]  # デモ用に全て0

        fig = go.Figure(data=[go.Bar(
            x=months,
            y=counts,
            marker_color='#FF6B9D',
            name='収集数'
        )])

        fig.update_layout(
            title="月別収集数",
            xaxis_title="月",
            yaxis_title="個数",
            font_family="Arial",
            font_size=12,
            margin=dict(l=20, r=20, t=40, b=20),
            height=250  # 高さを少し小さく
        )

        return fig

    # タグ検索（見かけだけ）
    color_tag_palette = [
        ("赤", "danger"), ("青", "primary"), ("緑", "success"), ("黄", "warning"),
        ("紫", "secondary"), ("黒", "dark"), ("白", "light"),
    ]

    tag_search = html.Div(
        [
            html.H4("タグ検索", className="card-title"),
            html.Div(
                [
                    dcc.Input(
                        placeholder="タグで検索（例: 猫、白、キーホルダー）",
                        className="form-control me-2",
                        style={"maxWidth": "420px"},
                        type="text",
                    ),
                    html.Button("検索", className="btn btn-light mt-2 mt-md-0"),
                ],
                className="d-flex flex-column flex-md-row align-items-start",
            ),
            html.Div(
                [
                    dbc.Badge(name, color=color, className=("me-2 mb-2" + (" text-dark" if color == "light" else "")))
                    for name, color in color_tag_palette
                ],
                className="mt-2",
            ),
        ],
        className="card text-white bg-secondary mb-3",
    )

    # 収納場所タグ × 製品種類（乱数・見かけだけ）
    def create_storage_chart_data() -> dict:
        product_types = ['ポストカード', '缶バッチ', 'アクリルスタンド']
        storage_tags = ['クリアファイル', 'タンス', 'ディスプレイ']
        colors = {
            'クリアファイル': '#0d6efd',
            'タンス': '#6c757d',
            'ディスプレイ': '#ffc107',
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
            'product_types': product_types,
            'storage_tags': storage_tags,
            'colors': colors,
            'counts': counts,
            'surplus': surplus,
            'flags': flags,
        }

    def create_storage_location_chart_from_data(data: dict, show_surplus: bool) -> go.Figure:
        product_types = data['product_types']
        storage_tags = data['storage_tags']
        colors = data['colors']
        counts = data['counts']
        surplus = data.get('surplus') or {tag: [0]*len(product_types) for tag in storage_tags}
        flags = data['flags']

        fig = go.Figure()
        for tag in storage_tags:
            base_vals = counts[tag]
            extra_vals = surplus.get(tag, [0]*len(product_types))
            # ON時は「余り」だけ、OFF時は全数
            y_vals = [extra_vals[i] if show_surplus else base_vals[i] for i in range(len(product_types))]
            tag_flags = flags[tag]
            texts = [('余' if (show_surplus and tag_flags[i]) else '') for i in range(len(product_types))]
            hover_flags = [('あり (' + str(extra_vals[i]) + ')' if tag_flags[i] else 'なし') for i in range(len(product_types))]
            fig.add_bar(
                name=tag,
                x=product_types,
                y=y_vals,
                marker_color=colors[tag],
                text=texts,
                textposition='outside',
                cliponaxis=False,
                customdata=hover_flags,
                hovertemplate='%{x}<br>%{y} 個<br>余り: %{customdata}<extra>' + tag + '</extra>',
            )

        fig.update_layout(
            title='収納場所タグ × 製品種類（プレゼン用・乱数）',
            xaxis_title='製品種類',
            yaxis_title='個数',
            barmode='group',
            legend_title_text='収納場所タグ',
            margin=dict(l=20, r=20, t=40, b=20),
            height=320,
        )
        return fig

    storage_chart_data = create_storage_chart_data()
    storage_chart_card = html.Div(
        [
            html.H4("収納場所タグ 集計", className="mb-2"),
            dbc.Switch(id='gallery-surplus-toggle', label='余りフラグを表示（ダブり把握）', value=False, className='mb-2'),
            dcc.Store(id='gallery-storage-chart-data', data=storage_chart_data),
            dcc.Graph(
                id='gallery-storage-chart',
                figure=create_storage_location_chart_from_data(storage_chart_data, False),
                config={'displayModeBar': False, 'responsive': True, 'autosizable': True},
                className="border rounded w-100",
                style={'height': '320px'},
            ),
        ],
        className="card p-4 mb-4",
    )

    if not photos:
        # ダッシュボードコンテンツ（写真がない場合）
        dashboard_content = html.Div(
            [
                tag_search,
                storage_chart_card,
                # 統計カード
                html.Div(
                    [
                        html.Div(
                            [
                                html.Div(
                                    [
                                        html.Div("0", className="card-title h2 mb-0"),
                                        html.Div("登録商品数", className="card-subtitle text-muted"),
                                    ],
                                    className="card-body",
                                ),
                            ],
                            className="card text-white bg-primary mb-3",
                        ),
                        html.Div(
                            [
                                html.Div(
                                    [
                                        html.Div("¥0", className="card-title h2 mb-0"),
                                        html.Div("総購入額", className="card-subtitle text-muted"),
                                    ],
                                    className="card-body",
                                ),
                            ],
                            className="card text-white bg-success mb-3",
                        ),
                        html.Div(
                            [
                                html.Div(
                                    [
                                        html.Div("0", className="card-title h2 mb-0"),
                                        html.Div("カテゴリ数", className="card-subtitle text-muted"),
                                    ],
                                    className="card-body",
                                ),
                            ],
                            className="card text-white bg-info mb-3",
                        ),
                    ],
                    className="row g-3 mb-4",
                ),

                # グラフセクション
                html.Div(
                    [
                        html.H4("📊 データ分析", className="mb-3"),
                        html.Div(
                            [
                                # カテゴリ別円グラフ
                                html.Div(
                                    [
                                        html.H6("商品カテゴリ分布", className="text-center mb-3"),
                                        dcc.Graph(
                                            figure=create_category_pie_chart(),
                                            config={
                                                'displayModeBar': False,
                                                'responsive': True,
                                                'autosizable': True
                                            },
                                            className="border rounded w-100",
                                            style={'height': '250px'}
                                        ),
                                    ],
                                    className="col-12 col-md-6 mb-4",
                                ),
                                # 月別棒グラフ
                                html.Div(
                                    [
                                        html.H6("月別収集数", className="text-center mb-3"),
                                        dcc.Graph(
                                            figure=create_monthly_bar_chart(),
                                            config={
                                                'displayModeBar': False,
                                                'responsive': True,
                                                'autosizable': True
                                            },
                                            className="border rounded w-100",
                                            style={'height': '250px'}
                                        ),
                                    ],
                                    className="col-12 col-md-6 mb-4",
                                ),
                            ],
                            className="row",
                        ),
                    ],
                    className="card p-4 mb-4",
                ),

                # クイックアクション
                html.Div(
                    [
                        html.H4("クイックアクション", className="mb-3"),
                        html.Div(
                            [
                                html.A(
                                    [
                                        html.I(className="bi bi-camera me-2"),
                                        "写真を登録する",
                                    ],
                                    href="/register",
                                    className="btn btn-primary btn-lg me-3 mb-2",
                                ),
                                html.A(
                                    [
                                        html.I(className="bi bi-gear me-2"),
                                        "設定",
                                    ],
                                    href="/settings",
                                    className="btn btn-outline-secondary btn-lg mb-2",
                                ),
                            ]
                        ),
                    ],
                    className="card p-4 mb-4",
                ),

                # 最近の活動（デモデータ）
                html.Div(
                    [
                        html.H4("最近の活動", className="mb-3"),
                        html.Div(
                            [
                                html.Div(
                                    [
                                        html.I(className="bi bi-circle-fill text-primary me-2"),
                                        html.Span("アプリを起動しました", className="me-2"),
                                        html.Small("たった今", className="text-muted"),
                                    ],
                                    className="d-flex align-items-center mb-2",
                                ),
                                html.Div(
                                    [
                                        html.I(className="bi bi-circle-fill text-secondary me-2"),
                                        html.Span("ダッシュボードを表示しました", className="me-2"),
                                        html.Small("たった今", className="text-muted"),
                                    ],
                                    className="d-flex align-items-center mb-2",
                                ),
                            ]
                        ),
                    ],
                    className="card p-4 mb-4",
                ),

                # ウェルカムメッセージ
                html.Div(
                    [
                        html.H4("📸 推し活グッズ管理をはじめよう！", className="mb-3"),
                html.P(
                            "バーコードをスキャンしたり写真をアップロードするだけで、簡単にグッズを登録・管理できます。",
                            className="mb-3",
                        ),
                        html.Ul(
                            [
                                html.Li("📱 スマホで簡単に登録"),
                                html.Li("🏷️ 自動でタグ付け"),
                                html.Li("📊 収集状況を一目で確認"),
                                html.Li("🎨 テーマ変更可能"),
                            ],
                            className="mb-0",
                        ),
                    ],
                    className="card p-4 bg-light",
                ),
            ]
        )
    else:
        # 写真がある場合は従来のギャラリー表示
        summary = html.Div(
            [
                html.P(
                    f"全 {len(photos)} 枚の写真が登録されています",
                    className="text-muted text-center mb-4",
                )
            ]
        )
        grid = html.Div(
            [
                html.Div(
                    [
                        html.Div(
                            [
                                # サムネイル（URLが無ければプレースホルダー）
                                (html.Img(
                                    src=photo.get("image_url"),
                                    style={"width": "100%", "height": "150px", "objectFit": "cover"},
                                ) if photo.get("image_url") else html.Div(
                                    [html.I(className="bi bi-image", style={"fontSize": "28px"})],
                                    className="d-flex align-items-center justify-content-center photo-placeholder",
                                )),
                                html.Div(
                                    [
                                        html.Div(
                                            f"バーコード: {photo.get('barcode', '')[:15]}...",
                                            className="fw-bold text-dark mb-1",
                                        ),
                                        html.Div(
                                            photo.get("description") or "説明なし",
                                            className="text-muted small",
                                        ),
                                        html.Div(
                                            [
                                                # カラータグ風のダミータグ（見かけだけ）
                                                *[dbc.Badge(n, color=c, className=("me-1" + (" text-dark" if c == "light" else "")))
                                                  for n, c in (
                                                      [color_tag_palette[(i*2) % len(color_tag_palette)],
                                                       color_tag_palette[(i*2+1) % len(color_tag_palette)]]
                                                  )]
                                            ],
                                            className="mt-1",
                                        ),
                                    ],
                                    className="photo-info",
                                ),
                            ],
                            className="photo-card",
                        )
                    ]
                )
                for i, photo in enumerate(photos)
            ],
            className="photo-grid",
        )
        dashboard_content = html.Div([tag_search, storage_chart_card, summary, grid])

    return html.Div([header, dashboard_content])


@callback(
    Output('gallery-storage-chart', 'figure'),
    Input('gallery-surplus-toggle', 'value'),
    State('gallery-storage-chart-data', 'data'),
)
def _update_storage_chart(show_surplus: bool, data: dict):
    product_types = data['product_types']
    storage_tags = data['storage_tags']
    colors = data['colors']
    counts = data['counts']
    surplus = data.get('surplus') or {tag: [0]*len(product_types) for tag in storage_tags}
    flags = data['flags']

    fig = go.Figure()
    for tag in storage_tags:
        base_vals = counts[tag]
        extra_vals = surplus.get(tag, [0]*len(product_types))
        y_vals = [extra_vals[i] if show_surplus else base_vals[i] for i in range(len(product_types))]
        tag_flags = flags[tag]
        texts = [('余' if (show_surplus and tag_flags[i]) else '') for i in range(len(product_types))]
        hover_flags = [('あり (' + str(extra_vals[i]) + ')' if tag_flags[i] else 'なし') for i in range(len(product_types))]
        fig.add_bar(
            name=tag,
            x=product_types,
            y=y_vals,
            marker_color=colors[tag],
            text=texts,
            textposition='outside',
            cliponaxis=False,
            customdata=hover_flags,
            hovertemplate='%{x}<br>%{y} 個<br>余り: %{customdata}<extra>' + tag + '</extra>',
        )

    fig.update_layout(
        title='収納場所タグ × 製品種類（プレゼン用・乱数）',
        xaxis_title='製品種類',
        yaxis_title='個数',
        barmode='group',
        legend_title_text='収納場所タグ',
        margin=dict(l=20, r=20, t=40, b=20),
        height=320,
    )
    return fig
