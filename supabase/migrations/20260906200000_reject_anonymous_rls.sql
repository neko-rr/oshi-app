-- Anonymous Sign-In 有効化前の必須ガード。
-- authenticated ロールのまま is_anonymous=true の JWT が来るため、
-- 既存の members_id = auth.uid() だけでは業務 CRUD が通ってしまう。
-- 公式推奨どおり RESTRICTIVE で拒否する。

create or replace function public.jwt_is_permanent_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

comment on function public.jwt_is_permanent_user() is
  'JWT が本登録ユーザーか（is_anonymous でない）。RLS RESTRICTIVE 用';

-- ---- public 業務表 ----
do $$
declare
  t text;
  tables text[] := array[
    'category_tag',
    'category_tag_preset_slot_dismissed',
    'color_tag',
    'display_settings',
    'gallery_view',
    'member',
    'photo',
    'registered_product',
    'registered_product_color_tag',
    'storage_location',
    'storage_location_preset_slot_dismissed',
    'theme_settings',
    'oshi_accent_settings',
    'data_export'
  ];
begin
  foreach t in array tables
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated '
      || 'using ( public.jwt_is_permanent_user() ) '
      || 'with check ( public.jwt_is_permanent_user() )',
      t || '_reject_anonymous',
      t
    );
  end loop;
end
$$;

-- ---- Storage（photos / exports 含む objects 全体）----
create policy storage_objects_reject_anonymous
  on storage.objects
  as restrictive
  for all
  to authenticated
  using ( public.jwt_is_permanent_user() )
  with check ( public.jwt_is_permanent_user() );
