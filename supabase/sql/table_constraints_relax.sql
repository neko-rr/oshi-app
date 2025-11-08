-- === 開発用: テーブル制約緩和SQL ===
-- 主キー以外でNOT NULL制約があるカラムをNULL許可に変更

-- 1. category_tagテーブルの必須カラム確認と緩和
-- （members_idが外部キーなので、開発中はNULL許可に）
ALTER TABLE category_tag
ALTER COLUMN members_id DROP NOT NULL;

-- 2. color_tagテーブルの必須カラム確認と緩和
ALTER TABLE color_tag
ALTER COLUMN members_id DROP NOT NULL;

-- 3. member_informationテーブルの必須カラム確認と緩和
-- （members_type_nameが外部キーなのでNULL許可）
ALTER TABLE member_information
ALTER COLUMN members_type_name DROP NOT NULL;

-- 4. photoテーブルの必須カラム確認と緩和
-- （photo_theme_colorが外部キーなのでNULL許可）
ALTER TABLE photo
ALTER COLUMN photo_theme_color DROP NOT NULL;

-- 5. product_regulations_sizeテーブルの必須カラム確認と緩和
ALTER TABLE product_regulations_size
ALTER COLUMN product_group_id DROP NOT NULL;

-- 6. 制約緩和後の確認
SELECT
    t.table_name,
    c.column_name,
    c.is_nullable,
    c.data_type,
    CASE
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FK'
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PK'
        ELSE ''
    END as constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.table_constraints tc
    ON c.table_name = tc.table_name
    AND c.column_name IN (
        SELECT kcu.column_name
        FROM information_schema.key_column_usage kcu
        WHERE kcu.constraint_name = tc.constraint_name
    )
    AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
WHERE c.table_schema = 'public'
    AND c.table_name IN ('category_tag', 'color_tag', 'member_information', 'photo', 'product_regulations_size', 'registration_product_information')
ORDER BY c.table_name, c.ordinal_position;
