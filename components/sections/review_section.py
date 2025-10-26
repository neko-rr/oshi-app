from dash import dcc, html


def render_review_section() -> html.Div:
    return html.Div(
        [
            html.Div(
                [
                    html.H3("タグを微調整", className="section-subtitle"),
                    html.P(
                        "自動生成されたタグにチェックを付け直せます。不要なタグは外し、必要なタグは追加してください。",
                        className="section-description",
                    ),
                    dcc.Checklist(id="tag-checklist", className="tag-checklist"),
                    html.Div(
                        [
                            dcc.Input(
                                id="custom-tag-input",
                                type="text",
                                placeholder="タグを追加 (例: イベント名)",
                                className="input-custom",
                            ),
                            html.Button(
                                "タグを追加",
                                id="add-tag-button",
                                className="btn-secondary",
                            ),
                        ],
                        className="manual-input-group",
                    ),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.H3("メモ / 特記事項", className="section-subtitle"),
                    dcc.Textarea(
                        id="note-editor",
                        className="textarea-custom",
                        placeholder="タグに補足したい情報や保管場所などを入力できます。",
                    ),
                ],
                className="card-custom",
            ),
            html.Div(id="review-summary", className="card-custom"),
            html.Div(
                html.Button(
                    "保存して登録を完了",
                    id="save-button",
                    className="btn-custom",
                    disabled=True,
                ),
                className="card-custom",
            ),
        ]
    )
