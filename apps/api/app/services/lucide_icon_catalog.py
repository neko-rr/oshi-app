"""Lucide アイコン slug カタログ（正本: docs/design/meta/lucide_icon_picker.json）。"""

from __future__ import annotations

FALLBACK_CATEGORY = "tag"
FALLBACK_STORAGE = "map-pin"

ALLOWED_SLUGS: frozenset[str] = frozenset(
    {
        "archive",
        "award",
        "badge",
        "bed",
        "bird",
        "book-marked",
        "book-open",
        "bookmark",
        "box",
        "brick-wall",
        "briefcase",
        "brush",
        "camera",
        "car",
        "cat",
        "cherry",
        "circle",
        "circle-dot",
        "cloud",
        "coffee",
        "crown",
        "dice-5",
        "disc",
        "ellipsis",
        "file-text",
        "fish",
        "flower-2",
        "frame",
        "gallery-vertical",
        "gamepad-2",
        "gem",
        "gift",
        "glasses",
        "grid-3x3",
        "hand-heart",
        "headphones",
        "heart",
        "home",
        "image",
        "images",
        "inbox",
        "key-round",
        "lamp",
        "lamp-desk",
        "laptop",
        "layers",
        "layout-grid",
        "library",
        "link",
        "map-pin",
        "medal",
        "mic",
        "mic-2",
        "moon",
        "music",
        "music-2",
        "newspaper",
        "package",
        "palette",
        "party-popper",
        "pen",
        "pencil",
        "person-standing",
        "picture-in-picture",
        "pin",
        "plane",
        "puzzle",
        "rabbit",
        "radio",
        "ribbon",
        "scissors",
        "scroll-text",
        "shirt",
        "shopping-bag",
        "smartphone",
        "smile",
        "sofa",
        "sparkles",
        "square",
        "star",
        "sticker",
        "store",
        "sun",
        "tag",
        "tags",
        "ticket",
        "train",
        "trophy",
        "tv",
        "umbrella",
        "user-round",
        "video",
        "wand-2",
        "warehouse",
        "watch",
    }
)

BOOTSTRAP_TO_LUCIDE: dict[str, str] = {
    "bi-archive": "archive",
    "bi-bag": "shopping-bag",
    "bi-book": "book-open",
    "bi-bookmark": "bookmark",
    "bi-bookshelf": "library",
    "bi-border": "frame",
    "bi-box": "box",
    "bi-briefcase": "briefcase",
    "bi-camera": "camera",
    "bi-cart": "shopping-bag",
    "bi-circle": "circle",
    "bi-file-earmark": "file-text",
    "bi-geo": "map-pin",
    "bi-gift": "gift",
    "bi-heart": "heart",
    "bi-house": "home",
    "bi-house-door": "home",
    "bi-image": "image",
    "bi-key": "key-round",
    "bi-laptop": "lamp-desk",
    "bi-music-note": "music",
    "bi-person": "user-round",
    "bi-pin": "pin",
    "bi-square": "layers",
    "bi-star": "star",
    "bi-tag": "tag",
    "bi-three-dots": "ellipsis",
}

DEFAULT_CATEGORY_TAGS: list[dict[str, object]] = [
    {
        "slot": 1,
        "category_tag_name": "アクリル",
        "category_tag_color": "#0d6efd",
        "category_tag_icon": "layers"
    },
    {
        "slot": 2,
        "category_tag_name": "缶バッジ",
        "category_tag_color": "#dc3545",
        "category_tag_icon": "circle"
    },
    {
        "slot": 3,
        "category_tag_name": "フィギュア",
        "category_tag_color": "#198754",
        "category_tag_icon": "person-standing"
    },
    {
        "slot": 4,
        "category_tag_name": "紙類",
        "category_tag_color": "#ffc107",
        "category_tag_icon": "file-text"
    },
    {
        "slot": 5,
        "category_tag_name": "ぬいぐるみ",
        "category_tag_color": "#6f42c1",
        "category_tag_icon": "heart"
    },
    {
        "slot": 6,
        "category_tag_name": "その他",
        "category_tag_color": "#6c757d",
        "category_tag_icon": "ellipsis"
    }
]

DEFAULT_STORAGE_LOCATIONS: list[dict[str, object]] = [
    {
        "slot": 1,
        "storage_location_name": "タンス",
        "storage_location_icon": "archive"
    },
    {
        "slot": 2,
        "storage_location_name": "棚",
        "storage_location_icon": "library"
    },
    {
        "slot": 3,
        "storage_location_name": "ケース",
        "storage_location_icon": "box"
    },
    {
        "slot": 4,
        "storage_location_name": "壁",
        "storage_location_icon": "frame"
    },
    {
        "slot": 5,
        "storage_location_name": "机",
        "storage_location_icon": "lamp-desk"
    },
    {
        "slot": 6,
        "storage_location_name": "その他",
        "storage_location_icon": "ellipsis"
    }
]


def normalize_lucide_icon_slug(raw: str | None, *, fallback: str) -> str:
    """bi-* レガシーと未知 slug を正規化。"""
    value = (raw or "").strip().lower()
    if not value:
        return fallback
    if value.startswith("bi-"):
        value = BOOTSTRAP_TO_LUCIDE.get(value, fallback)
    if value in ALLOWED_SLUGS:
        return value
    return fallback


def normalize_category_icon(raw: str | None) -> str:
    return normalize_lucide_icon_slug(raw, fallback=FALLBACK_CATEGORY)


def normalize_storage_icon(raw: str | None) -> str:
    return normalize_lucide_icon_slug(raw, fallback=FALLBACK_STORAGE)
