from dash import html

from components.sections import render_review_section


def render_review_page() -> html.Div:
    return html.Div(
        [
            html.Div([html.H1([html.I(className="bi bi-box-seam me-2"), "製品を登録する"])], className="header"),
            html.Section(
                [
                    html.H2("STEP 3. タグ候補", className="step-title"),
                    html.P(
                        "楽天APIの照合結果と画像説明から推定されたタグを表示します。",
                        className="step-description",
                    ),
                    html.Div(id="tag-feedback"),
                ],
                className="step-section",
            ),
            html.Section(
                [
                    html.H2("STEP 4. 微調整と登録", className="step-title"),
                    html.P(
                        "タグやメモを調整し、登録内容を確認してから保存してください。",
                        className="step-description",
                    ),
                    render_review_section(),
                ],
                className="step-section",
            ),
            html.Div(id="register-alert"),
        ]
    )
