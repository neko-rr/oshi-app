-- Add product_group_name column to registration_product_information table
ALTER TABLE registration_product_information
ADD COLUMN IF NOT EXISTS product_group_name TEXT;

-- Add comment to the column
COMMENT ON COLUMN registration_product_information.product_group_name IS '製品グループ名 - 缶バッジ、キーホルダーなどの製品形態';
