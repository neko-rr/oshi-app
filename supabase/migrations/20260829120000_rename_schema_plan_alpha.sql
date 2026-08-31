-- rename_schema_plan_alpha（2026-08-29）
-- 案α: 意味修正・長名短縮。ライブ DB へは Supabase MCP apply_migration で適用済み。

ALTER TABLE public.copyright_source RENAME TO copyright_company;
ALTER TABLE public.product_regulations_size RENAME TO product_size;
ALTER TABLE public.works_information RENAME TO work;
ALTER TABLE public.member_information RENAME TO member;
ALTER TABLE public.receipt_location RENAME TO storage_location;
ALTER TABLE public.receipt_location_preset_slot_dismissed RENAME TO storage_location_preset_slot_dismissed;
ALTER TABLE public.registration_product_information RENAME TO registered_product;
ALTER TABLE public.registration_product_color_tag RENAME TO registered_product_color_tag;

ALTER TABLE public.work RENAME COLUMN works_id TO work_id;
ALTER TABLE public.character RENAME COLUMN works_id TO work_id;

ALTER TABLE public.storage_location RENAME COLUMN receipt_location_id TO storage_location_id;
ALTER TABLE public.storage_location RENAME COLUMN receipt_location_name TO storage_location_name;
ALTER TABLE public.storage_location RENAME COLUMN receipt_location_size_horizontal TO storage_location_size_horizontal;
ALTER TABLE public.storage_location RENAME COLUMN receipt_location_size_depth TO storage_location_size_depth;
ALTER TABLE public.storage_location RENAME COLUMN receipt_location_size_vertical TO storage_location_size_vertical;
ALTER TABLE public.storage_location RENAME COLUMN receipt_count_per_1 TO storage_count_per_1;
ALTER TABLE public.storage_location RENAME COLUMN receipt_size_horizontal_per_1 TO storage_size_horizontal_per_1;
ALTER TABLE public.storage_location RENAME COLUMN receipt_size_depth_per_1 TO storage_size_depth_per_1;
ALTER TABLE public.storage_location RENAME COLUMN receipt_size_vertical_per_1 TO storage_size_vertical_per_1;
ALTER TABLE public.storage_location RENAME COLUMN receipt_location_icon TO storage_location_icon;
ALTER TABLE public.storage_location RENAME COLUMN receipt_location_use_flag TO storage_location_use_flag;

ALTER TABLE public.icon_tag RENAME COLUMN receipt_location_use_flag TO storage_location_use_flag;

ALTER TABLE public.registered_product RENAME COLUMN registration_product_id TO registered_product_id;
ALTER TABLE public.registered_product RENAME COLUMN works_id TO work_id;
ALTER TABLE public.registered_product RENAME COLUMN receipt_location_id TO storage_location_id;
ALTER TABLE public.registered_product RENAME COLUMN receipt_location_tag_id TO storage_location_tag_id;
ALTER TABLE public.registered_product RENAME COLUMN flag_with_freebie TO freebie_flag;

ALTER TABLE public.registered_product_color_tag RENAME COLUMN registration_product_id TO registered_product_id;

ALTER TABLE public.member_type RENAME COLUMN number_registerable_high_resolution TO high_resolution_registerable_number;

-- 以降: シーケンス・インデックス・トリガー・ポリシー名の整理はライブ適用済み。
-- 詳細は Supabase migration history: rename_schema_plan_alpha
