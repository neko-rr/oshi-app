-- ユーザー別 文字サイズ・UI密度（見た目設定）
-- 連携: authenticated GRANT + RLS self_all（theme_settings と同方針）

create table public.display_settings (
  members_id uuid not null references auth.users (id) on delete cascade,
  members_type_name text not null default 'default',
  text_scale smallint not null default 3
    check (text_scale >= 1 and text_scale <= 7),
  ui_density smallint not null default 4
    check (ui_density >= 1 and ui_density <= 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (members_id, members_type_name)
);

comment on table public.display_settings is
  'ユーザー別の文字サイズ・UI密度（1〜7 の離散プリセット）';

alter table public.display_settings enable row level security;

create policy display_settings_self_all
  on public.display_settings
  for all
  to authenticated
  using ( (select auth.uid()) = members_id )
  with check ( (select auth.uid()) = members_id );

create index display_settings_members_id_idx
  on public.display_settings (members_id);

grant select, insert, update, delete on table public.display_settings to authenticated;
grant all on table public.display_settings to service_role;
revoke all on table public.display_settings from anon;
