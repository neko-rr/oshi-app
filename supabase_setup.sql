-- Supabase Database Setup for Oshi App Demo
-- Execute this SQL in Supabase SQL Editor

-- Create tables based on spec.md

-- Add missing columns to existing tables
ALTER TABLE works_information ADD COLUMN IF NOT EXISTS copyright_company_name TEXT;

-- 1. Photo table
CREATE TABLE IF NOT EXISTS photos (
    photo_id SERIAL PRIMARY KEY,
    photo_theme_color INTEGER,
    front_flag INTEGER DEFAULT 1,
    photo_thumbnail_url TEXT,
    photo_high_resolution_url TEXT,
    photo_thumbnail_image_quality INTEGER,
    photo_high_resolution_flag INTEGER DEFAULT 1,
    photo_edited_flag INTEGER DEFAULT 0,
    photo_registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    photo_edit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Registration Product Information table
CREATE TABLE IF NOT EXISTS registration_product_information (
    registration_product_id SERIAL PRIMARY KEY,
    photo_id INTEGER REFERENCES photos(photo_id),
    works_series_id INTEGER,
    works_id INTEGER,
    character_id INTEGER,
    copyright_company_id INTEGER,
    product_group_id INTEGER,
    product_size_id INTEGER,
    receipt_location_id INTEGER,
    receipt_location_tag_id INTEGER,
    color_tag_id INTEGER,
    category_tag_id INTEGER,
    campaign_id INTEGER,
    currency_unit_id INTEGER,
    works_series_name TEXT,
    title TEXT,
    character_name TEXT,
    copyright_company_name TEXT,
    product_type TEXT,
    product_size_horizontal INTEGER,
    product_size_depth INTEGER,
    product_size_vertical INTEGER,
    barcode_number TEXT,
    barcode_type TEXT,
    product_name TEXT NOT NULL,
    list_price INTEGER,
    purchase_price INTEGER,
    registration_quantity INTEGER DEFAULT 1,
    sales_desired_quantity INTEGER,
    product_series_quantity INTEGER,
    purchase_location TEXT,
    freebie_name TEXT,
    purchase_date DATE,
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    other_tag TEXT,
    memo TEXT,
    product_series_flag INTEGER DEFAULT 0,
    product_series_complete_flag INTEGER DEFAULT 0,
    commercial_product_flag INTEGER DEFAULT 1,
    personal_product_flag INTEGER DEFAULT 0,
    digital_product_flag INTEGER DEFAULT 0,
    sales_desired_flag INTEGER DEFAULT 0,
    want_object_flag INTEGER DEFAULT 0,
    flag_with_freebie INTEGER DEFAULT 0
);

-- 3. Works Series table
CREATE TABLE IF NOT EXISTS works_series (
    works_series_id SERIAL PRIMARY KEY,
    works_series_name TEXT UNIQUE
);

-- 4. Works Information table
CREATE TABLE IF NOT EXISTS works_information (
    works_id SERIAL PRIMARY KEY,
    works_series_id INTEGER REFERENCES works_series(works_series_id),
    title TEXT NOT NULL,
    copyright_company_name TEXT
);

-- 5. Character table
CREATE TABLE IF NOT EXISTS character (
    character_id SERIAL PRIMARY KEY,
    works_id INTEGER REFERENCES works_information(works_id),
    character_name TEXT NOT NULL
);

-- 6. Copyright Source table
CREATE TABLE IF NOT EXISTS copyright_source (
    copyright_company_id SERIAL PRIMARY KEY,
    copyright_company_name TEXT UNIQUE
);

-- 7. Product Type table
CREATE TABLE IF NOT EXISTS product_type (
    product_type_id SERIAL PRIMARY KEY,
    product_type TEXT UNIQUE
);

-- 8. Product Regulations Size table
CREATE TABLE IF NOT EXISTS product_regulations_size (
    product_size_id SERIAL PRIMARY KEY,
    product_size_horizontal INTEGER,
    product_size_depth INTEGER,
    product_size_vertical INTEGER,
    size_name TEXT
);

-- 9. Receipt Location table
CREATE TABLE IF NOT EXISTS receipt_location (
    receipt_location_id SERIAL PRIMARY KEY,
    receipt_location_name TEXT UNIQUE
);

-- 10. Icon Tag table
CREATE TABLE IF NOT EXISTS icon_tag (
    icon_tag_id SERIAL PRIMARY KEY,
    icon TEXT UNIQUE,
    icon_name TEXT
);

-- 11. Color Tag table
CREATE TABLE IF NOT EXISTS color_tag (
    color_tag_id SERIAL PRIMARY KEY,
    members_id INTEGER,
    color_tag_color TEXT,
    color_tag_name TEXT
);

-- 12. Category Tag table
CREATE TABLE IF NOT EXISTS category_tag (
    category_tag_id SERIAL PRIMARY KEY,
    category_name TEXT UNIQUE
);

-- 13. Member Information table
CREATE TABLE IF NOT EXISTS member_information (
    members_id SERIAL PRIMARY KEY,
    members_type_name TEXT,
    user_name TEXT,
    email_address TEXT,
    x_id TEXT,
    instagram_id TEXT,
    line_id TEXT
);

-- 14. Member Type table
CREATE TABLE IF NOT EXISTS member_type (
    members_type_name TEXT PRIMARY KEY,
    thumbnail_image_quality INTEGER,
    registerable_number INTEGER,
    number_registerable_high_resolution INTEGER
);

-- 15. Currency Unit table
CREATE TABLE IF NOT EXISTS currency_unit (
    currency_unit_id SERIAL PRIMARY KEY,
    currency_code TEXT UNIQUE,
    currency_name TEXT
);

-- Sample data insertion removed due to encoding issues
-- You can manually insert data if needed after successful table creation

-- Disable RLS for all tables (for demo purposes)
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_product_information DISABLE ROW LEVEL SECURITY;
ALTER TABLE works_series DISABLE ROW LEVEL SECURITY;
ALTER TABLE works_information DISABLE ROW LEVEL SECURITY;
ALTER TABLE character DISABLE ROW LEVEL SECURITY;
ALTER TABLE copyright_source DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_type DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_regulations_size DISABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_location DISABLE ROW LEVEL SECURITY;
ALTER TABLE icon_tag DISABLE ROW LEVEL SECURITY;
ALTER TABLE color_tag DISABLE ROW LEVEL SECURITY;
ALTER TABLE category_tag DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_information DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_type DISABLE ROW LEVEL SECURITY;
ALTER TABLE currency_unit DISABLE ROW LEVEL SECURITY;
