-- Add product_series_complete_flag column to registration_product_information table

ALTER TABLE registration_product_information
ADD COLUMN IF NOT EXISTS product_series_complete_flag INTEGER DEFAULT 0;

-- Add comment to the column
COMMENT ON COLUMN registration_product_information.product_series_complete_flag IS '製品シリーズコンプリートフラグ - 0:未完了, 1:完了';

-- Create index for better performance if needed
CREATE INDEX IF NOT EXISTS idx_registration_product_series_complete_flag ON registration_product_information(product_series_complete_flag);
