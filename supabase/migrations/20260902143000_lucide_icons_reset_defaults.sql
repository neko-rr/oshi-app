-- Dash Bootstrap Icons (bi-*) を Lucide slug へ移行。
-- 既定スロット 1..6 の名称・色・アイコンを全ユーザーでリセット（theme リセットと同方針）。

-- 1) bi-* → lucide（既知マップ）
UPDATE public.category_tag
SET category_tag_icon = CASE category_tag_icon
    WHEN 'bi-tag' THEN 'tag'
    WHEN 'bi-square' THEN 'layers'
    WHEN 'bi-circle' THEN 'circle'
    WHEN 'bi-person' THEN 'user-round'
    WHEN 'bi-file-earmark' THEN 'file-text'
    WHEN 'bi-heart' THEN 'heart'
    WHEN 'bi-three-dots' THEN 'ellipsis'
    WHEN 'bi-book' THEN 'book-open'
    WHEN 'bi-key' THEN 'key-round'
    WHEN 'bi-house' THEN 'home'
    WHEN 'bi-house-door' THEN 'home'
    WHEN 'bi-briefcase' THEN 'briefcase'
    WHEN 'bi-star' THEN 'star'
    WHEN 'bi-gift' THEN 'gift'
    WHEN 'bi-music-note' THEN 'music'
    WHEN 'bi-camera' THEN 'camera'
    WHEN 'bi-image' THEN 'image'
    WHEN 'bi-pin' THEN 'pin'
    WHEN 'bi-bookmark' THEN 'bookmark'
    WHEN 'bi-cart' THEN 'shopping-bag'
    WHEN 'bi-bag' THEN 'shopping-bag'
    ELSE 'tag'
END,
updated_at = now()
WHERE category_tag_icon LIKE 'bi-%';

UPDATE public.storage_location
SET storage_location_icon = CASE storage_location_icon
    WHEN 'bi-geo' THEN 'map-pin'
    WHEN 'bi-archive' THEN 'archive'
    WHEN 'bi-bookshelf' THEN 'library'
    WHEN 'bi-box' THEN 'box'
    WHEN 'bi-border' THEN 'frame'
    WHEN 'bi-laptop' THEN 'lamp-desk'
    WHEN 'bi-three-dots' THEN 'ellipsis'
    ELSE 'map-pin'
END,
updated_at = now()
WHERE storage_location_icon LIKE 'bi-%';

-- 2) 既定スロット 1..6 を Lucide デフォルトへ（全ユーザー）
UPDATE public.category_tag AS ct
SET
    category_tag_name = d.name,
    category_tag_color = d.color,
    category_tag_icon = d.icon,
    updated_at = now()
FROM (
    VALUES
        (1, 'アクリル', '#0d6efd', 'layers'),
        (2, '缶バッジ', '#dc3545', 'circle'),
        (3, 'フィギュア', '#198754', 'person-standing'),
        (4, '紙類', '#ffc107', 'file-text'),
        (5, 'ぬいぐるみ', '#6f42c1', 'heart'),
        (6, 'その他', '#6c757d', 'ellipsis')
) AS d(slot, name, color, icon)
WHERE ct.slot = d.slot;

UPDATE public.storage_location AS sl
SET
    storage_location_name = d.name,
    storage_location_icon = d.icon,
    updated_at = now()
FROM (
    VALUES
        (1, 'タンス', 'archive'),
        (2, '棚', 'library'),
        (3, 'ケース', 'box'),
        (4, '壁', 'frame'),
        (5, '机', 'lamp-desk'),
        (6, 'その他', 'ellipsis')
) AS d(slot, name, icon)
WHERE sl.slot = d.slot;
