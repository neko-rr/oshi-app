from dash import html, dcc, register_page
from components.theme_utils import load_theme, CURRENT_THEME
from components.theme_palette import BOOTSWATCH_SWATCH
from services.photo_service import get_product_stats
from services.supabase_client import get_supabase_client
import dash_bootstrap_components as dbc


def render_settings() -> html.Div:
    current_theme = load_theme()
    supabase = get_supabase_client()
    if supabase is None:
        total_photos = 0
    else:
        stats = get_product_stats(supabase)
        total_photos = stats.get("total_photos", 0)
    return html.Div(
        [
            html.Div(
                [html.H1([html.I(className="bi bi-gear me-2"), "設定"])],
                className="header",
            ),
            # 認証情報 + ログアウト（テーマに追従する中立カード）
            html.Div(
                [
                    html.H4("認証情報", className="card-title"),
                    html.Div(
                        id="settings-user-info",
                        children="ログイン中のユーザーを取得中...",
                        className="mb-2",
                    ),
                    html.Div(
                        id="settings-logout-msg",
                        style={"color": "red", "marginTop": "4px"},
                        className="small",
                    ),
                    html.Form(
                        action="/auth/logout",
                        method="post",
                        children=[
                            html.Button(
                                "ログアウト",
                                type="submit",
                                className="btn btn-outline-primary mt-2",
                            )
                        ],
                    ),
                    # /auth/me で email/id を取得して表示する簡易スクリプト
                    html.Script(
                        """
                        document.addEventListener('DOMContentLoaded', () => {
                          const infoEl = document.getElementById('settings-user-info');
                          if (infoEl) {
                            fetch('/auth/me', { credentials: 'include' })
                              .then(r => r.json())
                              .then(d => {
                                if (d.error || (!d.email && !d.id)) {
                                  infoEl.textContent = '取得できませんでした';
                                  return;
                                }
                                const email = d.email || '(emailなし)';
                                const uid = d.id || '(id不明)';
                                infoEl.textContent = `${email} / id: ${uid}`;
                              })
                              .catch(() => { infoEl.textContent = '取得できませんでした'; });
                          }
                        });
                        """
                    ),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.H4(
                        "アプリ情報",
                        className="card-title",
                    ),
                    html.P(
                        [html.Strong("バージョン: "), "1.0.0"],
                        className="card-text mb-2",
                    ),
                    html.P(
                        [html.Strong("登録写真数: "), f"{total_photos} 枚"],
                        className="card-text mb-0",
                    ),
                    html.Div(
                        [
                            html.Span("データ提供: ", className="me-2"),
                            html.A(
                                html.Img(
                                    src="https://webservice.rakuten.co.jp/img/credit/200709/credit_22121.gif",
                                    alt="Rakuten Web Service Center",
                                    title="Rakuten Web Service Center",
                                    width="221",
                                    height="21",
                                    style={"border": "0"},
                                ),
                                href="https://webservice.rakuten.co.jp/",
                                target="_blank",
                                rel="noopener noreferrer",
                            ),
                        ],
                        className="mt-3 d-inline-flex align-items-center gap-2",
                    ),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.H4(
                        "テーマ設定",
                        className="card-title",
                    ),
                    html.P(
                        "カードを選ぶとすぐプレビューと適用が切り替わります。保存ボタンで永続化します。",
                        className="card-text mb-3",
                    ),
                    dcc.Store(id="theme-preview-store", data=current_theme or CURRENT_THEME),
                    html.Div(
                        [
                            html.Div(
                                [
                                    html.Div(
                                        [
                                            html.Div(theme.title(), className="fw-semibold mb-2"),
                                            html.Div(
                                                [
                                                    html.Span(
                                                        "",
                                                        style={
                                                            "display": "inline-block",
                                                            "width": "32px",
                                                            "height": "32px",
                                                            "background": BOOTSWATCH_SWATCH[theme]["primary"],
                                                            "borderRadius": "8px",
                                                        },
                                                    ),
                                                    html.Span(
                                                        "",
                                                        style={
                                                            "display": "inline-block",
                                                            "width": "32px",
                                                            "height": "32px",
                                                            "background": BOOTSWATCH_SWATCH[theme]["secondary"],
                                                            "borderRadius": "8px",
                                                        },
                                                    ),
                                                    html.Span(
                                                        "",
                                                        style={
                                                            "display": "inline-block",
                                                            "width": "32px",
                                                            "height": "32px",
                                                            "background": BOOTSWATCH_SWATCH[theme]["body_color"],
                                                            "borderRadius": "8px",
                                                        },
                                                    ),
                                                    html.Span(
                                                        "",
                                                        style={
                                                            "display": "inline-block",
                                                            "width": "32px",
                                                            "height": "32px",
                                                            "background": BOOTSWATCH_SWATCH[theme]["body_bg"],
                                                            "border": "1px solid #dee2e6",
                                                            "borderRadius": "8px",
                                                        },
                                                    ),
                                                ],
                                                className="theme-swatch-grid",
                                            ),
                                        ],
                                        className="card-body p-3",
                                    ),
                                ],
                                className="card theme-card",
                                id={"type": "theme-card", "theme": theme},
                                n_clicks=0,
                                style={
                                    "minWidth": "170px",
                                    "maxWidth": "180px",
                                    "minHeight": "140px",
                                },
                            )
                            for theme in BOOTSWATCH_SWATCH.keys()
                        ],
                        className="d-flex flex-row flex-nowrap gap-3 mb-3",
                        style={"overflowX": "auto"},
                    ),
                    html.Div(
                        html.Button(
                            "テーマを保存",
                            id="save-theme-button",
                            n_clicks=0,
                            className="btn btn-outline-primary",
                        ),
                        className="mb-2",
                    ),
                    html.Div(
                        id="theme-preview-name",
                        className="text-body-secondary small mb-1",
                        children=f"選択中: {current_theme or CURRENT_THEME}",
                    ),
                    html.Div(id="theme-save-result", className="mt-2"),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.H4(
                        "タグ設定",
                        className="card-title",
                    ),
                    html.Div(
                        [
                            dcc.Link(
                                "カラータグ",
                                href="/settings/color-tags",
                                className="btn btn-outline-primary me-2 mb-2",
                            ),
                            html.Button(
                                "カテゴリータグ",
                                n_clicks=0,
                                className="btn btn-outline-primary me-2 mb-2",
                            ),
                            html.Button(
                                "収納場所タグ",
                                n_clicks=0,
                                className="btn btn-outline-primary mb-2",
                            ),
                        ]
                    ),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.H4(
                        "SNS共有用文 設定",
                        className="card-title",
                    ),
                    html.Div(
                        [
                            html.Button(
                                "X用",
                                n_clicks=0,
                                className="btn btn-outline-primary me-2 mb-2",
                                id="btn-x-share",
                            ),
                            html.Button(
                                "Instagram用",
                                n_clicks=0,
                                className="btn btn-outline-primary me-2 mb-2",
                            ),
                            html.Button(
                                "LINE用",
                                n_clicks=0,
                                className="btn btn-outline-primary mb-2",
                            ),
                        ]
                    ),
                    html.Div(
                        id="x-share-config",
                        style={"display": "none"},
                        children=[
                            dcc.Textarea(
                                id="x-share-textarea",
                                placeholder="X用の共有文を入力（目安: 280文字）",
                                style={"width": "100%", "minHeight": "120px"},
                                className="form-control",
                            ),
                            html.Div(
                                id="x-share-count",
                                className="small text-white-50 mt-1",
                                children="文字数: 0/280",
                            ),
                            html.Button(
                                "設定",
                                id="x-share-save-dummy",
                                n_clicks=0,
                                className="btn btn-outline-primary mt-2",
                            ),
                        ],
                    ),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.H4(
                        "データ管理",
                        className="card-title",
                    ),
                    html.Button(
                        "全てのデータを削除",
                        id="delete-all-button",
                        n_clicks=0,
                        className="btn btn-danger",
                    ),
                    html.Div(id="delete-result", className="mt-3"),
                ],
                className="card-custom",
            ),
            html.Div(
                [
                    html.H4(
                        "使い方",
                        className="card-title",
                    ),
                    html.P(
                        "このアプリは、商品のバーコードをスキャンして写真を管理するためのアプリです。",
                        className="card-text mb-3",
                    ),
                    html.P(
                        "写真をアップロードすると、自動的にバーコードを検出して登録します。",
                        className="card-text mb-0",
                    ),
                ],
                className="card-custom",
            ),
        ]
    )


register_page(
    __name__,
    path="/settings",
    title="設定 - おしごとアプリ",
)

try:
    layout = render_settings()
except Exception as e:
    layout = html.Div(
        f"Settings page error: {str(e)}", style={"color": "red", "padding": "20px"}
    )
