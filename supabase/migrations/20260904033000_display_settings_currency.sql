-- display_settings: 金額表示（通貨記号・桁区切り。換算はしない）
alter table public.display_settings
  add column if not exists currency_code_override text null,
  add column if not exists currency_format_mode text not null default 'residence';

alter table public.display_settings
  drop constraint if exists display_settings_currency_format_mode_check;
alter table public.display_settings
  add constraint display_settings_currency_format_mode_check
  check (currency_format_mode in ('residence', 'ui_locale', 'plain'));

comment on column public.display_settings.currency_code_override is
  '表示通貨 ISO 4217（null なら居住地の既定。換算なし・表示のみ）';
comment on column public.display_settings.currency_format_mode is
  '金額の書き方: residence / ui_locale / plain';
