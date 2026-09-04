-- 居住地・TZ の短い CHECK を外し、検証は API（カタログ / zoneinfo）に委譲
alter table public.display_settings
  drop constraint if exists display_settings_residence_region_check;

alter table public.display_settings
  drop constraint if exists display_settings_timezone_override_check;

comment on column public.display_settings.residence_region is
  '居住地プリセット ID（アプリ側カタログ。CHECK なし）';
comment on column public.display_settings.timezone_override is
  'IANA タイムゾーン上書き（null なら居住地の標準 TZ。CHECK なし・API で zoneinfo 検証）';
