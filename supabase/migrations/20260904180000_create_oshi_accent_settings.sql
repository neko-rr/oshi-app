-- ユーザー別 推し色（メイン＋サブ）。適用・永続化はプレミアム entitlement 想定。
-- 連携: authenticated GRANT + RLS self_all（theme_settings / display_settings と同方針）

create table public.oshi_accent_settings (
  members_id uuid not null references auth.users (id) on delete cascade,
  members_type_name text not null default 'default',
  main_hex text not null default '#9f606c',
  sub_hex text not null default '#6a9bb8',
  active boolean not null default false,
  presets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (members_id, members_type_name),
  constraint oshi_accent_settings_main_hex_format
    check (main_hex ~ '^#[0-9A-Fa-f]{6}$'),
  constraint oshi_accent_settings_sub_hex_format
    check (sub_hex ~ '^#[0-9A-Fa-f]{6}$')
);

comment on table public.oshi_accent_settings is
  'ユーザー別推し色（メイン／サブ hex・適用フラグ・プリセット最大3）';

alter table public.oshi_accent_settings enable row level security;

create policy oshi_accent_settings_self_all
  on public.oshi_accent_settings
  for all
  to authenticated
  using ( (select auth.uid()) = members_id )
  with check ( (select auth.uid()) = members_id );

create index oshi_accent_settings_members_id_idx
  on public.oshi_accent_settings (members_id);

grant select, insert, update, delete on table public.oshi_accent_settings to authenticated;
grant all on table public.oshi_accent_settings to service_role;
revoke all on table public.oshi_accent_settings from anon;
