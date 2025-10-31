import datetime
from dash import dcc, html


def render_review_section() -> html.Div:
    return html.Div(
        [
            # 写真サムネールと製品名
            html.Div(
                [
                    html.Div(
                        [
                            html.H4("正面写真", className="card-title"),
                            html.Img(
                                id="photo-thumbnail",
                                src="",
                                className="img-fluid rounded",
                                style={"maxHeight": "200px", "maxWidth": "200px"},
                            ),
                        ],
                        className="col-md-4",
                    ),
                    html.Div(
                        [
                            html.H4(["製品名", html.Span("＊", style={"color": "red"})], className="card-title"),
                            dcc.Input(
                                id="product-name-input",
                                type="text",
                                className="form-control",
                                placeholder="製品名を入力してください",
                                required=True,
                            ),
                        ],
                        className="col-md-8",
                    ),
                ],
                className="row mb-4",
            ),

            # 製品サイズ情報
            html.Div(
                [
                    html.H4("製品サイズ情報", className="card-title mb-3"),
                    html.Div(
                        [
                            html.Div(
                                [
                                    html.Label("製品グループ名", className="form-label"),
                                    dcc.Input(
                                        id="product-group-name-input",
                                        type="text",
                                        className="form-control",
                                        placeholder="例: 缶バッジ、キーホルダー",
                                    ),
                                ],
                                className="col-md-3",
                            ),
                            html.Div(
                                [
                                    html.Label("サイズ横 (mm)", className="form-label"),
                                    dcc.Input(
                                        id="product-size-width-input",
                                        type="number",
                                        className="form-control",
                                        placeholder="横幅",
                                    ),
                                ],
                                className="col-md-3",
                            ),
                            html.Div(
                                [
                                    html.Label("サイズ奥行 (mm)", className="form-label"),
                                    dcc.Input(
                                        id="product-size-depth-input",
                                        type="number",
                                        className="form-control",
                                        placeholder="奥行き",
                                    ),
                                ],
                                className="col-md-3",
                            ),
                            html.Div(
                                [
                                    html.Label("サイズ縦 (mm)", className="form-label"),
                                    dcc.Input(
                                        id="product-size-height-input",
                                        type="number",
                                        className="form-control",
                                        placeholder="高さ",
                                    ),
                                ],
                                className="col-md-3",
                            ),
                        ],
                        className="row",
                    ),
                ],
                className="card bg-light p-3 mb-4",
            ),

            # 製品フラグとシリーズ情報
            html.Div(
                [
                    html.Div(
                        [
                            html.H4("製品タイプ", className="card-title mb-3"),
                            html.Div(
                                [
                                    html.Div(
                                        [
                                            dcc.Checklist(
                                                id="product-series-flag",
                                                options=[{"label": "製品シリーズフラグ", "value": "series"}],
                                                className="form-check",
                                            ),
                                        ],
                                        className="col-md-6",
                                    ),
                                    html.Div(
                                        [
                                            html.Label("製品シリーズ数量", className="form-label"),
                                            dcc.Input(
                                                id="product-series-quantity-input",
                                                type="number",
                                                className="form-control",
                                                placeholder="シリーズ内の総数",
                                                disabled=True,
                                            ),
                                        ],
                                        id="series-quantity-container",
                                        className="col-md-6",
                                        style={"display": "none"},
                                    ),
                                ],
                                className="row",
                            ),
                            html.Hr(),
                            html.Div(
                                [
                                    dcc.Checklist(
                                        id="product-type-flags",
                                        options=[
                                            {"label": "商用製品", "value": "commercial"},
                                            {"label": "同人製品", "value": "doujin"},
                                            {"label": "デジタル製品", "value": "digital"},
                                        ],
                                        className="form-check",
                                    ),
                                ]
                            ),
                        ],
                        className="col-md-6",
                    ),
                    html.Div(
                        [
                            html.H4("作品情報", className="card-title mb-3"),
                            html.Div(
                                [
                                    html.Label("作品シリーズ名", className="form-label"),
                                    dcc.Input(
                                        id="works-series-name-input",
                                        type="text",
                                        className="form-control",
                                        placeholder="例: バンドリ！ ガールズバンドパーティ！",
                                    ),
                                ],
                                className="mb-3",
                            ),
                            html.Div(
                                [
                                    html.Label("作品名", className="form-label"),
                                    dcc.Input(
                                        id="works-name-input",
                                        type="text",
                                        className="form-control",
                                        placeholder="例: バンドリ！",
                                    ),
                                ],
                                className="mb-3",
                            ),
                            html.Div(
                                [
                                    html.Label("キャラクター名", className="form-label"),
                                    dcc.Input(
                                        id="character-name-input",
                                        type="text",
                                        className="form-control",
                                        placeholder="例: 戸山 香澄",
                                    ),
                                ],
                                className="mb-3",
                            ),
                            html.Div(
                                [
                                    html.Label("版権会社名", className="form-label"),
                                    dcc.Input(
                                        id="copyright-company-input",
                                        type="text",
                                        className="form-control",
                                        placeholder="例: ブシロード",
                                    ),
                                ],
                                className="mb-3",
                            ),
                        ],
                        className="col-md-6",
                    ),
                ],
                className="row mb-4",
            ),

            # 価格・購入情報
            html.Div(
                [
                    html.H4("価格・購入情報", className="card-title mb-3"),
                    html.Div(
                        [
                            html.Div(
                                [
                                    html.Label("定価 (円)", className="form-label"),
                                    dcc.Input(
                                        id="list-price-input",
                                        type="number",
                                        className="form-control",
                                        placeholder="定価を入力",
                                    ),
                                ],
                                className="col-md-3",
                            ),
                            html.Div(
                                [
                                    html.Label("購入価格 (円)", className="form-label"),
                                    dcc.Input(
                                        id="purchase-price-input",
                                        type="number",
                                        className="form-control",
                                        placeholder="実際に支払った金額",
                                    ),
                                ],
                                className="col-md-3",
                            ),
                            html.Div(
                                [
                                    html.Label("購入場所", className="form-label"),
                                    dcc.Input(
                                        id="purchase-location-input",
                                        type="text",
                                        className="form-control",
                                        placeholder="例: アニメイト渋谷店",
                                    ),
                                ],
                                className="col-md-3",
                            ),
                            html.Div(
                                [
                                    html.Label("購入日", className="form-label"),
                                    dcc.DatePickerSingle(
                                        id="purchase-date-input",
                                        className="form-control",
                                        display_format="YYYY/MM/DD",
                                        date=datetime.date.today().isoformat(),
                                        placeholder="購入日を選択",
                                    ),
                                ],
                                className="col-md-3",
                            ),
                        ],
                        className="row",
                    ),
                ],
                className="card bg-light p-3 mb-4",
            ),

            # メモ
            html.Div(
                [
                    html.H4("メモ / 特記事項", className="card-title"),
                    dcc.Textarea(
                        id="note-editor",
                        className="form-control",
                        placeholder="保管場所や特記事項を入力してください。",
                        style={"minHeight": "120px"},
                    ),
                ],
                className="card bg-primary text-white p-3 mb-4",
            ),

            # その他タグ（編集不可）
            html.Div(
                [
                    html.H4("その他タグ", className="card-title mb-3"),
                    html.P("STEP3で抽出されたタグのうち、他の項目（製品名、キャラクター名など）で使用されていないタグを表示しています。利用者は編集できません。", className="text-muted"),
                    dcc.Checklist(
                        id="other-tags-checklist",
                        className="form-check",
                        style={"pointerEvents": "none", "opacity": "0.6"},  # 編集不可
                    ),
                ],
                className="card bg-info text-white p-3 mb-4",
            ),

            # 保存ボタン
            html.Div(
                [
                    html.Button(
                        "保存して登録を完了",
                        id="save-button",
                        className="btn btn-success btn-lg",
                        disabled=True,
                    ),
                ],
                className="text-center",
            ),

            # IOインテリジェンス処理状態確認用のインターバル
            dcc.Interval(
                id="io-intelligence-interval",
                interval=2000,  # 2秒ごとにチェック
                n_intervals=0,
                disabled=False,
            ),

            # STEP4自動反映用のインターバル（app.pyで定義）
            # auto_fill_interval は app.py で定義済み

            # 隠し要素：元のタグチェックリスト（後方互換性のため）
            dcc.Checklist(id="tag-checklist", style={"display": "none"}),
        ],
        className="container-fluid",
    )
