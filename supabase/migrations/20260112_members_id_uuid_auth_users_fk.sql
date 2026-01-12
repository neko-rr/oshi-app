-- Supabase Auth の user.id(UUID) を唯一のユーザーIDとして利用する。
-- 既存データは破棄する前提で、ユーザー所有テーブルを再作成する。

-- 依存関係を解体
drop table if exists public.theme_settings cascade;
drop table if exists public.color_tag cascade;
drop table if exists public.category_tag cascade;
drop table if exists public.registration_product_information cascade;
drop table if exists public.photo cascade;

-- photo: ユーザー所有の写真。members_id は auth.users 参照
create table public.photo (
  photo_id serial primary key,
  members_id uuid not null references auth.users(id) on delete cascade,
  photo_theme_color integer references public.color(color_group_id) on delete set null,
  front_flag integer default 0,
  photo_thumbnail bytea,
  photo_thumbnail_image_quality integer default 80,
  photo_high_resolution_flag integer default 0,
  photo_edited_flag integer default 0,
  photo_registration_date timestamptz default now(),
  photo_edit_date timestamptz,
  photo_thumbnail_url text,
  photo_high_resolution_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_photo_member on public.photo(members_id);
create index if not exists idx_photo_theme_color on public.photo(photo_theme_color);

-- color_tag: ユーザー所有のカラータグ
create table public.color_tag (
  color_tag_id serial primary key,
  members_id uuid not null references auth.users(id) on delete cascade,
  color_tag_color text,
  color_tag_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_color_tag_member on public.color_tag(members_id);

-- category_tag: ユーザー所有のカテゴリタグ
create table public.category_tag (
  category_tag_id serial primary key,
  members_id uuid not null references auth.users(id) on delete cascade,
  category_tag_color text,
  category_tag_name text not null,
  category_tag_icon text,
  category_tag_use_flag integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_category_tag_member on public.category_tag(members_id);

-- registration_product_information: ユーザー所有の登録商品
create table public.registration_product_information (
  registration_product_id serial primary key,
  members_id uuid not null references auth.users(id) on delete cascade,
  photo_id integer references public.photo(photo_id) on delete set null,
  works_series_id integer references public.works_series(works_series_id) on delete set null,
  works_id integer references public.works_information(works_id) on delete set null,
  character_id integer references public.character(character_id) on delete set null,
  copyright_company_id integer references public.copyright_source(copyright_company_id) on delete set null,
  product_group_id integer references public.product_type(product_group_id) on delete set null,
  product_size_id integer references public.product_regulations_size(product_size_id) on delete set null,
  receipt_location_id integer references public.receipt_location(receipt_location_id) on delete set null,
  receipt_location_tag_id integer,
  color_tag_id integer references public.color_tag(color_tag_id) on delete set null,
  category_tag_id integer references public.category_tag(category_tag_id) on delete set null,
  campaign_id integer,
  currency_unit_id integer references public.currency_unit(currency_unit_id) on delete set null,
  works_series_name text,
  title text,
  character_name text,
  copyright_company_name text,
  product_type text,
  product_size_horizontal integer,
  product_size_depth integer,
  product_size_vertical integer,
  barcode_number text,
  barcode_type text,
  product_name text,
  list_price integer,
  purchase_price integer,
  registration_quantity integer default 1,
  sales_desired_quantity integer,
  product_series_quantity integer,
  purchase_location text,
  freebie_name text,
  purchase_date date,
  creation_date timestamptz default now(),
  updated_date timestamptz default now(),
  other_tag text,
  memo text,
  product_series_flag integer default 0,
  commercial_product_flag integer default 1,
  personal_product_flag integer default 0,
  digital_product_flag integer default 0,
  sales_desired_flag integer default 0,
  want_object_flag integer default 0,
  flag_with_freebie integer default 0,
  product_series_complete_flag integer default 0,
  product_group_name text
);
create index if not exists idx_rpi_member on public.registration_product_information(members_id);
create index if not exists idx_rpi_photo on public.registration_product_information(photo_id);
create index if not exists idx_rpi_works_series on public.registration_product_information(works_series_id);
create index if not exists idx_rpi_works on public.registration_product_information(works_id);
create index if not exists idx_rpi_character on public.registration_product_information(character_id);
create index if not exists idx_rpi_copyright on public.registration_product_information(copyright_company_id);
create index if not exists idx_rpi_product_group on public.registration_product_information(product_group_id);
create index if not exists idx_rpi_product_size on public.registration_product_information(product_size_id);
create index if not exists idx_rpi_receipt_location on public.registration_product_information(receipt_location_id);
create index if not exists idx_rpi_color_tag on public.registration_product_information(color_tag_id);
create index if not exists idx_rpi_category_tag on public.registration_product_information(category_tag_id);
create index if not exists idx_rpi_barcode on public.registration_product_information(barcode_number);
create index if not exists idx_rpi_creation_date on public.registration_product_information(creation_date desc);
create index if not exists idx_rpi_updated_date on public.registration_product_information(updated_date desc);

-- theme_settings: ユーザーごとのテーマ
create table public.theme_settings (
  members_id uuid not null references auth.users(id) on delete cascade,
  members_type_name text not null,
  theme text not null default 'minty',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint theme_settings_pkey primary key (members_id, members_type_name)
);

-- updated_at トリガー（存在する場合のみ張る）
do $$
begin
  if exists (select 1 from pg_proc where proname = 'update_updated_at_column') then
    create trigger update_photo_updated_at
      before update on public.photo
      for each row execute function public.update_updated_at_column();

    create trigger update_rpi_updated_at
      before update on public.registration_product_information
      for each row execute function public.update_updated_at_column();

    create trigger update_color_tag_updated_at
      before update on public.color_tag
      for each row execute function public.update_updated_at_column();

    create trigger update_category_tag_updated_at
      before update on public.category_tag
      for each row execute function public.update_updated_at_column();

    create trigger update_theme_settings_updated_at
      before update on public.theme_settings
      for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- RLS: 全テーブルを auth.uid() = members_id に限定
alter table if exists public.photo enable row level security;
alter table if exists public.registration_product_information enable row level security;
alter table if exists public.color_tag enable row level security;
alter table if exists public.category_tag enable row level security;
alter table if exists public.theme_settings enable row level security;
alter table if exists public.member_information enable row level security;

-- 既存ポリシーを除去
drop policy if exists photo_self_all on public.photo;
drop policy if exists rpi_self_all on public.registration_product_information;
drop policy if exists color_tag_self_all on public.color_tag;
drop policy if exists category_tag_self_all on public.category_tag;
drop policy if exists theme_settings_self_all on public.theme_settings;
drop policy if exists member_information_self_select on public.member_information;
drop policy if exists member_information_self_update on public.member_information;
drop policy if exists member_information_self_insert on public.member_information;

-- 新ポリシー
create policy photo_self_all
  on public.photo
  for all
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

create policy rpi_self_all
  on public.registration_product_information
  for all
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

create policy color_tag_self_all
  on public.color_tag
  for all
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

create policy category_tag_self_all
  on public.category_tag
  for all
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

create policy theme_settings_self_all
  on public.theme_settings
  for all
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

create policy member_information_self_select
  on public.member_information
  for select
  using (auth.uid() = members_id);

create policy member_information_self_update
  on public.member_information
  for update
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

create policy member_information_self_insert
  on public.member_information
  for insert
  with check (auth.uid() = members_id);
