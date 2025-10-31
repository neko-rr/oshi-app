from dash import html, dcc
import plotly.graph_objects as go
from typing import Iterable, Mapping

Photo = Mapping[str, str]


def render_gallery(photos: Iterable[Photo]) -> html.Div:
    photos = list(photos)

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

    if not photos:
        # ダッシュボードコンテンツ（写真がない場合）
        dashboard_content = html.Div(
            [
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
                                html.Img(
                                    src=photo.get("image_url"),
                                    style={
                                        "width": "100%",
                                        "height": "150px",
                                        "objectFit": "cover",
                                    },
                                ),
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
                                    ],
                                    className="photo-info",
                                ),
                            ],
                            className="photo-card",
                        )
                    ]
                )
                for photo in photos
            ],
            className="photo-grid",
        )
        dashboard_content = html.Div([summary, grid])

    return html.Div([header, dashboard_content])
