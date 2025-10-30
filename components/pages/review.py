from dash import html

from components.sections import render_review_section


def render_review_page() -> html.Div:
    return html.Div(
        [
            html.Div([html.H1([html.I(className="bi bi-box-seam me-2"), "製品を登録する"])], className="header"),
            html.Section(
                [
                    html.H2("STEP 3. API結果とタグ抽出", className="step-title"),
                    html.P(
                        "バーコードから取得した楽天APIの照合結果と、写真から抽出したタグを表示します。",
                        className="step-description",
                    ),
                    html.Div(id="rakuten-lookup-display"),
                    html.Div(id="io-intelligence-tags-display", className="mt-3"),
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
