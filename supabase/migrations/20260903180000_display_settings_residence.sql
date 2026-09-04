-- display_settings: 居住地・日時表示
alter table public.display_settings
  add column if not exists residence_region text not null default 'jp',
  add column if not exists timezone_override text null,
  add column if not exists date_format_mode text not null default 'residence';

alter table public.display_settings
  drop constraint if exists display_settings_residence_region_check;
alter table public.display_settings
  add constraint display_settings_residence_region_check
  check (residence_region in (
    'jp', 'kr', 'tw', 'us_pacific', 'us_eastern', 'uk', 'other'
  ));

alter table public.display_settings
  drop constraint if exists display_settings_date_format_mode_check;
alter table public.display_settings
  add constraint display_settings_date_format_mode_check
  check (date_format_mode in ('residence', 'ui_locale', 'iso'));

alter table public.display_settings
  drop constraint if exists display_settings_timezone_override_check;
alter table public.display_settings
  add constraint display_settings_timezone_override_check
  check (
    timezone_override is null
    or timezone_override in (
      'Asia/Tokyo',
      'Asia/Seoul',
      'Asia/Taipei',
      'America/Los_Angeles',
      'America/New_York',
      'Europe/London',
      'UTC'
    )
  );

comment on column public.display_settings.residence_region is
  '居住地プリセット（日時表示の既定 TZ / 日付ロケール）';
comment on column public.display_settings.timezone_override is
  'タイムゾーン個別上書き（null なら居住地の標準 TZ）';
comment on column public.display_settings.date_format_mode is
  '日付書き方: residence / ui_locale / iso';
