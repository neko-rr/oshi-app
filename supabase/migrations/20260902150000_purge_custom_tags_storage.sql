-- ユーザー追加のカテゴリ・収納（slot 未設定 / 1..6 外）を削除し、既定 slot 1..6 のみ残す。
-- テストデータ整理。製品への参照は NULL に外してから DELETE。

UPDATE public.registered_product
SET category_tag_id = NULL
WHERE category_tag_id IN (
    SELECT category_tag_id
    FROM public.category_tag
    WHERE slot IS NULL OR slot NOT BETWEEN 1 AND 6
);

UPDATE public.registered_product
SET storage_location_id = NULL
WHERE storage_location_id IN (
    SELECT storage_location_id
    FROM public.storage_location
    WHERE slot IS NULL OR slot NOT BETWEEN 1 AND 6
);

DELETE FROM public.category_tag
WHERE slot IS NULL OR slot NOT BETWEEN 1 AND 6;

DELETE FROM public.storage_location
WHERE slot IS NULL OR slot NOT BETWEEN 1 AND 6;

-- 残った slot 1..6 を Lucide デフォルトに揃える（冪等）
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
