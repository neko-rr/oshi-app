-- === テーブル制約確認と修正SQL ===

-- 1. 現在の制約を確認
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY')
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- 2. 主な問題テーブル: registration_product_information の制約を緩和
-- 外部キー制約をNULL許可に変更
ALTER TABLE registration_product_information
ALTER COLUMN photo_id DROP NOT NULL;

-- 他の外部キーも必要に応じてNULL許可に
-- （開発中なので、まずはphoto_idだけを必須外に）

-- 3. 確認: NULL許可になったかチェック
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'registration_product_information'
  AND table_schema = 'public'
ORDER BY ordinal_position;
