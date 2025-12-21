-- テーマ設定テーブル（将来ユーザー毎に設定可能）
create table if not exists theme_settings (
  members_id int4 not null,
  members_type_name text not null,
  theme text not null default 'minty',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint theme_settings_pkey primary key (members_id, members_type_name)
);

create or replace function theme_settings_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists theme_settings_set_updated_at on theme_settings;
create trigger theme_settings_set_updated_at
before update on theme_settings
for each row execute function theme_settings_set_updated_at();
