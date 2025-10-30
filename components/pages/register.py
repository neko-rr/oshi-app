from dash import html

from components.sections import (
    render_barcode_section,
    render_front_photo_section,
    render_review_section,
)


def render_register_page() -> html.Div:
    return html.Div(
        [
            html.Div([html.H1([html.I(className="bi bi-box-seam me-2"), "製品を登録する"])], className="header"),
            html.Section(
                [
                    html.H2("STEP 1. バーコードの取得", className="step-title"),
                    html.P(
                        "バーコードを読み取る / アップロードする / 番号を手入力するのいずれかで情報を取得します。",
                        className="step-description",
                    ),
                    render_barcode_section(),
                    html.Div(id="barcode-feedback"),
                ],
                className="step-section",
            ),
            html.Section(
                [
                    html.H2("STEP 2. 正面写真の登録", className="step-title"),
                    html.P(
                        "グッズの正面がしっかり写る写真を撮影またはアップロードしてください。スキップも選択できます。",
                        className="step-description",
                    ),
                    render_front_photo_section(),
                    html.Div(id="front-feedback"),
                ],
                className="step-section",
            ),
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
