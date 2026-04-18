from dash import register_page

from features.category_tag.components import render_category_tags_settings


register_page(
    __name__,
    path="/settings/category-tags",
    title="カテゴリータグ設定 - おしごとアプリ",
    layout=render_category_tags_settings,
)
