from dash import register_page
from features.color_tag.components import render_color_tags_settings


register_page(
    __name__,
    path="/settings/color-tags",
    title="カラータグ設定 - おしごとアプリ",
    layout=render_color_tags_settings,
)
