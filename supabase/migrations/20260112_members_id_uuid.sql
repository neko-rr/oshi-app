-- members_id を Supabase Auth の user.id(UUID) に統一する
-- 既存データは破棄して再作成（DROP → CREATE 前提）

-- 依存するFKを一旦解体（色タグ/カテゴリタグのFKが registration_product_information にある場合を考慮）
alter table if exists public.registration_product_information
  drop constraint if exists registration_product_information_color_tag_id_fkey;
alter table if exists public.registration_product_information
  drop constraint if exists registration_product_information_category_tag_id_fkey;

-- 既存テーブルを削除（データ破棄前提）
drop table if exists public.theme_settings cascade;
drop table if exists public.color_tag cascade;
drop table if exists public.category_tag cascade;
drop table if exists public.member_information cascade;

-- member_information: PK を auth.users.id に揃える
create table public.member_information (
  members_id uuid primary key references auth.users(id) on delete cascade,
  members_type_name text references public.member_type(members_type_name) on delete set null,
  user_name text,
  email_address text unique,
  x_id text,
  instagram_id text,
  line_id text,
  identity_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- color_tag: members_id を uuid FK に変更（color_tag_id は従来通り serial）
create table public.color_tag (
  color_tag_id serial primary key,
  members_id uuid not null references public.member_information(members_id) on delete cascade,
  color_tag_color text,
  color_tag_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_color_tag_member on public.color_tag(members_id);

-- category_tag: members_id を uuid FK に変更（category_tag_id は従来通り serial）
create table public.category_tag (
  category_tag_id serial primary key,
  members_id uuid not null references public.member_information(members_id) on delete cascade,
  category_tag_color text,
  category_tag_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_category_tag_member on public.category_tag(members_id);

-- theme_settings: members_id を uuid にし、複合PKを維持
create table public.theme_settings (
  members_id uuid not null references public.member_information(members_id) on delete cascade,
  members_type_name text not null,
  theme text not null default 'minty',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint theme_settings_pkey primary key (members_id, members_type_name)
);

-- updated_at トリガー（既存の update_updated_at_column() を利用）
do $$
begin
  if exists (select 1 from pg_proc where proname = 'update_updated_at_column') then
    create trigger update_member_information_updated_at
      before update on public.member_information
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

-- registration_product_information の FK を再接続（列型は既存の integer を維持）
alter table if exists public.registration_product_information
  add constraint registration_product_information_color_tag_id_fkey
    foreign key (color_tag_id) references public.color_tag(color_tag_id);
alter table if exists public.registration_product_information
  add constraint registration_product_information_category_tag_id_fkey
    foreign key (category_tag_id) references public.category_tag(category_tag_id);

-- RLS を self 参照に寄せる（最低限のポリシー）
alter table if exists public.member_information enable row level security;
alter table if exists public.color_tag enable row level security;
alter table if exists public.category_tag enable row level security;
alter table if exists public.theme_settings enable row level security;

-- member_information: 自分自身のみ参照/更新を許可
-- member_information: 自分自身のみ参照/更新を許可
drop policy if exists member_information_self_select on public.member_information;
drop policy if exists member_information_self_update on public.member_information;
drop policy if exists member_information_self_insert on public.member_information;

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

-- color_tag
drop policy if exists color_tag_self_all on public.color_tag;

create policy color_tag_self_all
  on public.color_tag
  for all
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

-- category_tag
drop policy if exists category_tag_self_all on public.category_tag;

create policy category_tag_self_all
  on public.category_tag
  for all
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

-- theme_settings
drop policy if exists theme_settings_self_all on public.theme_settings;

create policy theme_settings_self_all
  on public.theme_settings
  for all
  using (auth.uid() = members_id)
  with check (auth.uid() = members_id);

-- auth.users 作成時に member_information を自動生成（メールも同期）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.member_information (members_id, email_address)
  values (new.id, new.email)
  on conflict (members_id) do update
    set email_address = excluded.email_address;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
