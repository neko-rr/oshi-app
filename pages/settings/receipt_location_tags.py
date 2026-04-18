from dash import register_page

from features.receipt_location_tag.components import render_receipt_location_tags_settings


register_page(
    __name__,
    path="/settings/receipt-location-tags",
    title="収納場所タグ設定 - おしごとアプリ",
    layout=render_receipt_location_tags_settings,
)
